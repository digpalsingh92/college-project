"""
train_models.py
===============
Hospital Resource Prediction – full training pipeline.

STEP-BY-STEP EXPLANATION
-------------------------
Step 1 – Load & inspect the raw CSV.
Step 2 – Clean and parse dates.
Step 3 – Feature engineering (create the features the model will learn from).
Step 4 – Engineer the TARGET variables (what we want to predict).
Step 5 – Train a Gradient Boosted Regressor → predicted waiting time (minutes).
Step 6 – Train a Gradient Boosted Classifier → resource load (Low/Medium/High).
Step 7 – Evaluate both models.
Step 8 – Save both models + the column order so the Flask API can use them later.

Run it:
    source .venv/bin/activate
    python train_models.py
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.metrics import mean_absolute_error, classification_report
from sklearn.preprocessing import LabelEncoder

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 – Load the raw data
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 1 – Loading raw data")
print("="*60)

CSV_PATH = os.path.join(os.path.dirname(__file__), "KaggleV2-May-2016.csv")
df = pd.read_csv(CSV_PATH)

print(f"  Rows : {len(df):,}")
print(f"  Cols : {list(df.columns)}")
print(df.head(3).to_string())

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 – Clean & parse dates
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 2 – Cleaning & parsing dates")
print("="*60)

# Fix inconsistent column name
df.rename(columns={"No-show": "NoShow", "Hipertension": "Hypertension"}, inplace=True)

# Parse ISO datetime strings → proper datetime objects
df["ScheduledDay"]   = pd.to_datetime(df["ScheduledDay"],   utc=True)
df["AppointmentDay"] = pd.to_datetime(df["AppointmentDay"], utc=True)

# Drop rows with obviously wrong data (negative age, age > 120)
before = len(df)
df = df[(df["Age"] >= 0) & (df["Age"] <= 120)]
print(f"  Dropped {before - len(df)} rows with invalid age")

# Encode NoShow: Yes → 1 (patient didn't come), No → 0
df["NoShow"] = (df["NoShow"] == "Yes").astype(int)

print("  Date columns parsed OK")
print(f"  NoShow distribution:\n{df['NoShow'].value_counts().to_string()}")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 – Feature engineering
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 3 – Feature engineering")
print("="*60)

"""
WHY each feature matters:
  - wait_days         : days between scheduling and appointment → major driver
  - sched_hour        : hour of day the appointment was scheduled (busy hours → longer wait)
  - appt_dayofweek    : Mon=0…Sun=6 (Mondays are busier)
  - appt_hour         : hour of appointment slot
  - Age               : elderly patients may have longer consultations
  - Hypertension etc. : chronic conditions → longer consults
  - SMS_received      : proxy for organised/planned appointments
  - daily_appt_count  : how many appointments are on the SAME day in the same neighbourhood
                        (proxy for how loaded the clinic is that day)
"""

# Days between scheduling and appointment (lead time)
df["wait_days"] = (df["AppointmentDay"] - df["ScheduledDay"]).dt.days.clip(lower=0)

# Time features
df["sched_hour"]     = df["ScheduledDay"].dt.hour
df["appt_dayofweek"] = df["AppointmentDay"].dt.dayofweek     # 0=Mon
df["appt_hour"]      = df["AppointmentDay"].dt.hour          # usually 0 from this dataset
df["appt_month"]     = df["AppointmentDay"].dt.month

# How many appointments are booked on each calendar day? (load proxy)
df["daily_appt_count"] = df.groupby("AppointmentDay")["AppointmentID"].transform("count")

# Previous no-shows per patient (requires sorting by time)
df.sort_values(["PatientId", "ScheduledDay"], inplace=True)
df["prev_noshow_count"] = (
    df.groupby("PatientId")["NoShow"]
    .transform(lambda x: x.shift(1).fillna(0).cumsum())
    .astype(int)
)

# Gender: encode M=1, F=0
df["Gender_enc"] = (df["Gender"] == "M").astype(int)

print(f"  New features: wait_days, sched_hour, appt_dayofweek, appt_hour,")
print(f"                appt_month, daily_appt_count, prev_noshow_count, Gender_enc")
print(f"  wait_days stats:\n{df['wait_days'].describe().to_string()}")
print(f"  daily_appt_count stats:\n{df['daily_appt_count'].describe().to_string()}")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 – Engineer TARGET variables
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 4 – Engineering target variables")
print("="*60)

"""
The dataset does NOT include an actual waiting time column.
We SIMULATE a realistic waiting time using domain knowledge:

    wait_minutes = base_wait
                 + (daily_load_factor × avg_consult_time)
                 + age_factor
                 + chronic_penalty
                 + random_noise

This is a common technique in data science when the true label is absent:
derive a proxy target that correlates with real world behaviour.
"""

AVERAGE_CONSULT_MINUTES = 15    # standard GP consultation
DOCTOR_CAPACITY_PER_HOUR = 3   # ~3 patients / doctor / hour

# Normalise daily load to [0, 1]
max_daily = df["daily_appt_count"].max()
df["load_ratio"] = df["daily_appt_count"] / max_daily

# Simulated wait time (minutes)
np.random.seed(42)
df["wait_minutes"] = (
    10                                                    # base wait
    + df["load_ratio"] * 45                               # load component (up to 45 min extra)
    + (df["Age"] > 60).astype(int) * 5                    # elderly add 5 min
    + (df["Hypertension"] + df["Diabetes"]
       + df["Alcoholism"]) * 3                             # chronic conditions
    + df["prev_noshow_count"] * 2                          # frequent no-shows → rescheduled later
    + np.random.normal(0, 5, len(df))                      # real-world noise
).clip(lower=5).round(1)

"""
Resource load label using QUANTILE-based thresholds.
Why? The daily_appt_count in this dataset clusters tightly so a fixed
0.33/0.66 split would put almost everything in one bucket.
Quantile thresholds guarantee a balanced three-way split regardless
of the absolute numbers – this is the right approach for imbalanced
continuous distributions.
  Bottom 33 % of days → Low
  Middle 34 %         → Medium
  Top 33 %            → High
"""
q33 = df["daily_appt_count"].quantile(0.33)
q66 = df["daily_appt_count"].quantile(0.66)

def label_load(count: float) -> str:
    if count <= q33:
        return "Low"
    elif count <= q66:
        return "Medium"
    return "High"

df["resource_load"] = df["daily_appt_count"].apply(label_load)
print(f"  Quantile thresholds → Low ≤ {q33:.0f}  Medium ≤ {q66:.0f}  High > {q66:.0f}")

print(f"  wait_minutes stats:\n{df['wait_minutes'].describe().to_string()}")
print(f"  resource_load distribution:\n{df['resource_load'].value_counts().to_string()}")

# Encode resource_load for the classifier (Low=0, Medium=1, High=2)
le = LabelEncoder()
df["resource_load_enc"] = le.fit_transform(df["resource_load"])
print(f"  LabelEncoder classes: {le.classes_}")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 – Train wait-time regressor
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 5 – Training wait-time regressor (GradientBoostingRegressor)")
print("="*60)

FEATURES = [
    "Age", "Gender_enc", "Scholarship", "Hypertension", "Diabetes",
    "Alcoholism", "Handcap", "SMS_received",
    "wait_days", "sched_hour", "appt_dayofweek", "appt_hour", "appt_month",
    "daily_appt_count", "prev_noshow_count", "load_ratio",
]

X = df[FEATURES]
y_wait = df["wait_minutes"]
y_load = df["resource_load_enc"]

X_train, X_test, y_wait_train, y_wait_test, y_load_train, y_load_test = train_test_split(
    X, y_wait, y_load, test_size=0.2, random_state=42
)

print(f"  Train samples : {len(X_train):,}")
print(f"  Test  samples : {len(X_test):,}")
print("  Training regressor… (this takes ~30 sec)")

reg = GradientBoostingRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42,
)
reg.fit(X_train, y_wait_train)

preds_wait = reg.predict(X_test)
mae = mean_absolute_error(y_wait_test, preds_wait)
print(f"  ✓ Regressor trained   MAE = {mae:.2f} minutes")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 – Train resource-load classifier
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 6 – Training resource-load classifier (GradientBoostingClassifier)")
print("="*60)

print("  Training classifier…")
clf = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42,
)
clf.fit(X_train, y_load_train)

preds_load = clf.predict(X_test)
print("  ✓ Classifier trained")
print("\n  Classification report:")
print(classification_report(y_load_test, preds_load, target_names=le.classes_))

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 – Feature importance (insight)
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 7 – Top feature importances (regressor)")
print("="*60)

importances = pd.Series(reg.feature_importances_, index=FEATURES).sort_values(ascending=False)
for feat, imp in importances.items():
    bar = "█" * int(imp * 100)
    print(f"  {feat:<25} {imp:.4f}  {bar}")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 8 – Save models
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 8 – Saving models to app/models/saved/")
print("="*60)

SAVE_DIR = os.path.join(os.path.dirname(__file__), "app", "models", "saved")
os.makedirs(SAVE_DIR, exist_ok=True)

thresholds = {"q33": float(q33), "q66": float(q66)}

joblib.dump(reg,        os.path.join(SAVE_DIR, "wait_time_regressor.joblib"))
joblib.dump(clf,        os.path.join(SAVE_DIR, "resource_load_classifier.joblib"))
joblib.dump(le,         os.path.join(SAVE_DIR, "label_encoder.joblib"))
joblib.dump(FEATURES,   os.path.join(SAVE_DIR, "feature_columns.joblib"))
joblib.dump(thresholds, os.path.join(SAVE_DIR, "load_thresholds.joblib"))

print("  Saved: wait_time_regressor.joblib")
print("  Saved: resource_load_classifier.joblib")
print("  Saved: label_encoder.joblib")
print("  Saved: feature_columns.joblib")
print("  Saved: load_thresholds.joblib")
print(f"\n  Thresholds → {thresholds}")
print("\n  ✅ Training complete! Run the Flask app to use the models.\n")
