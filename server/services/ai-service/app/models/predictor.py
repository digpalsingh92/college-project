"""
predictor.py
============
Loads saved models and exposes a single `predict_hospital()` function.

HOW INFERENCE WORKS
-------------------
The model was trained on aggregate appointment-day features, but at runtime
a user provides "live" inputs (patients waiting, doctor count, consult time).
We bridge the gap in two stages:

Stage A – Formula-based core wait:
  base_wait = (patients_waiting × avg_consult_minutes) / doctors_available

Stage B – ML demographic adjustment:
  We build a feature vector using the live inputs, feed it to the trained
  regressor, and treat the delta from the training mean as an adjustment.
  This adds the effect of age, chronic conditions, etc.

Resource load is determined by the patients-per-doctor ratio:
  < 3  → Low    ( < 3 patients queued per available doctor)
  < 7  → Medium
  ≥ 7  → High
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

_SAVE_DIR   = Path(os.getenv("MODEL_PATH", "app/models/saved"))
_TRAIN_MEAN_WAIT = 53.2   # mean wait_minutes across training set (from Step 4 output)
_MAX_DAILY       = 4691   # max daily_appt_count in training data

_reg        = None
_clf        = None
_le         = None
_features   = None
_thresholds = None


def _load_artifacts() -> None:
    global _reg, _clf, _le, _features, _thresholds
    _reg        = joblib.load(_SAVE_DIR / "wait_time_regressor.joblib")
    _clf        = joblib.load(_SAVE_DIR / "resource_load_classifier.joblib")
    _le         = joblib.load(_SAVE_DIR / "label_encoder.joblib")
    _features   = joblib.load(_SAVE_DIR / "feature_columns.joblib")
    _thresholds = joblib.load(_SAVE_DIR / "load_thresholds.joblib")


def _ensure_loaded() -> None:
    if _reg is None:
        _load_artifacts()


def _build_feature_vector(
    *,
    age: int,
    gender: str,
    hypertension: int,
    diabetes: int,
    alcoholism: int,
    handcap: int,
    scholarship: int,
    sms_received: int,
    patients_waiting: int,
    doctors_available: int,
    appt_hour: int,
    now: datetime,
) -> np.ndarray:
    """
    Map live input values → the exact 16 features the model was trained on.

    Key mapping decisions:
      daily_appt_count  : hospitals typically see ~4000-4700 appointments/day total
                          (from training data). We estimate it from
                          occupancy = patients_waiting / doctors_available.
                          Capped at max_daily to stay in distribution.
      wait_days         : 0 (patient is here, day-of appointment)
      prev_noshow_count : 0 (unknown at admission time; conservative default)
      load_ratio        : daily_appt_count / max_daily
    """
    patients_per_doc  = max(patients_waiting / max(doctors_available, 1), 0)
    # Map 0-20 patients-per-doctor range → training daily_appt_count range
    occupancy_fraction = min(patients_per_doc / 15.0, 1.0)
    daily_appt_count   = 4000 + occupancy_fraction * (_MAX_DAILY - 4000)
    load_ratio         = daily_appt_count / _MAX_DAILY

    gender_enc = 1 if str(gender).upper().startswith("M") else 0

    row = {
        "Age":                age,
        "Gender_enc":         gender_enc,
        "Scholarship":        scholarship,
        "Hypertension":       hypertension,
        "Diabetes":           diabetes,
        "Alcoholism":         alcoholism,
        "Handcap":            handcap,
        "SMS_received":       sms_received,
        "wait_days":          0,
        "sched_hour":         now.hour,
        "appt_dayofweek":     now.weekday(),
        "appt_hour":          appt_hour,
        "appt_month":         now.month,
        "daily_appt_count":   daily_appt_count,
        "prev_noshow_count":  0,
        "load_ratio":         load_ratio,
    }
    return pd.DataFrame([row])


def _resource_load_from_ratio(patients_per_doc: float) -> str:
    """
    Intuitive real-time resource load based on queue depth per doctor.
    Thresholds derived from domain knowledge:
      < 2  patients/doctor → Low    (doctor is largely free)
      < 5  patients/doctor → Medium (normal operating load)
      ≥ 5  patients/doctor → High   (doctor queue is saturated)
    """
    if patients_per_doc < 2:
        return "Low"
    elif patients_per_doc < 5:
        return "Medium"
    return "High"


def predict_hospital(
    patients_waiting: int,
    avg_consult_minutes: float,
    doctors_available: int,
    appointment_hour: int | None = None,
    age: int = 35,
    gender: str = "M",
    hypertension: int = 0,
    diabetes: int = 0,
    alcoholism: int = 0,
    handcap: int = 0,
    scholarship: int = 0,
    sms_received: int = 0,
) -> dict[str, Any]:
    _ensure_loaded()

    now         = datetime.now(timezone.utc)
    appt_hour   = appointment_hour if appointment_hour is not None else now.hour
    patients_per_doc = patients_waiting / max(doctors_available, 1)

    # ── Stage A: Formula-based core wait ─────────────────────────────────────
    # If all patients ahead finish sequentially across all doctors:
    base_wait = (patients_waiting * avg_consult_minutes) / max(doctors_available, 1)

    # ── Stage B: ML demographic adjustment ───────────────────────────────────
    fvec = _build_feature_vector(
        age=age, gender=gender,
        hypertension=hypertension, diabetes=diabetes,
        alcoholism=alcoholism, handcap=handcap,
        scholarship=scholarship, sms_received=sms_received,
        patients_waiting=patients_waiting,
        doctors_available=doctors_available,
        appt_hour=appt_hour,
        now=now,
    )
    ml_pred    = float(_reg.predict(fvec)[0])
    adjustment = ml_pred - _TRAIN_MEAN_WAIT   # how much above/below average

    final_wait = max(5.0, round(base_wait + adjustment, 1))

    # ── Resource load ─────────────────────────────────────────────────────────
    resource_load = _resource_load_from_ratio(patients_per_doc)

    # ── Build reason string ───────────────────────────────────────────────────
    chronic_flags = []
    if hypertension:  chronic_flags.append("hypertension")
    if diabetes:      chronic_flags.append("diabetes")
    if alcoholism:    chronic_flags.append("alcoholism")

    reason_parts = [
        f"{patients_waiting} patient(s) ahead across {doctors_available} doctor(s)",
        f"avg consultation ~{avg_consult_minutes:.0f} min",
        f"base queue time ~{base_wait:.0f} min",
    ]
    if adjustment > 1:
        reason_parts.append(f"demographic factors add ~{adjustment:.0f} min (age {age}"
                            + (f", {', '.join(chronic_flags)}" if chronic_flags else "") + ")")
    elif adjustment < -1:
        reason_parts.append(f"demographic profile reduces wait by ~{abs(adjustment):.0f} min")

    if resource_load == "High":
        reason_parts.append("hospital is under HIGH load")
    elif resource_load == "Medium":
        reason_parts.append("hospital is under moderate load")
    else:
        reason_parts.append("hospital load is low")

    return {
        "predicted_wait_time_minutes": final_wait,
        "resource_load":               resource_load,
        "reason":                      "; ".join(reason_parts),
        "breakdown": {
            "base_queue_wait_minutes": round(base_wait, 1),
            "ml_demographic_adjustment_minutes": round(adjustment, 1),
            "patients_per_doctor": round(patients_per_doc, 1),
        },
    }
