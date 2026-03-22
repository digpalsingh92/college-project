from flask import Blueprint, request, jsonify
from ..models.predictor import predict_hospital

predict_bp = Blueprint("predict", __name__)


@predict_bp.post("/predict")
def predict():
    """
    Hospital resource prediction endpoint.

    Required body fields:
      patients_waiting        (int)   – patients currently in queue
      avg_consult_minutes     (float) – avg time per consultation in minutes
      doctors_available       (int)   – doctors on duty right now

    Optional body fields:
      appointment_hour        (int)   – 0-23, defaults to current UTC hour
      age                     (int)   – patient age, default 35
      gender                  (str)   – "M" or "F", default "M"
      hypertension            (int)   – 0 or 1
      diabetes                (int)   – 0 or 1
      alcoholism              (int)   – 0 or 1
      handcap                 (int)   – 0 or 1
      scholarship             (int)   – 0 or 1
      sms_received            (int)   – 0 or 1

    Response:
      {
        "Predicted Wait Time": "<X> minutes",
        "Resource Load": "Low | Medium | High",
        "Reason": "..."
      }
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "JSON body required"}), 400

    # ── Validate required fields ──────────────────────────────────────────────
    required = ["patients_waiting", "avg_consult_minutes", "doctors_available"]
    missing  = [f for f in required if f not in payload]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        patients_waiting    = int(payload["patients_waiting"])
        avg_consult_minutes = float(payload["avg_consult_minutes"])
        doctors_available   = int(payload["doctors_available"])
    except (ValueError, TypeError) as exc:
        return jsonify({"error": f"Invalid field type: {exc}"}), 400

    if patients_waiting < 0 or avg_consult_minutes <= 0 or doctors_available <= 0:
        return jsonify({"error": "patients_waiting ≥ 0, consult time > 0, doctors > 0 required"}), 400

    # ── Optional fields with safe defaults ───────────────────────────────────
    kwargs = {
        "appointment_hour":  payload.get("appointment_hour"),
        "age":               int(payload.get("age", 35)),
        "gender":            str(payload.get("gender", "M")),
        "hypertension":      int(payload.get("hypertension", 0)),
        "diabetes":          int(payload.get("diabetes", 0)),
        "alcoholism":        int(payload.get("alcoholism", 0)),
        "handcap":           int(payload.get("handcap", 0)),
        "scholarship":       int(payload.get("scholarship", 0)),
        "sms_received":      int(payload.get("sms_received", 0)),
    }

    try:
        result = predict_hospital(
            patients_waiting=patients_waiting,
            avg_consult_minutes=avg_consult_minutes,
            doctors_available=doctors_available,
            **kwargs,
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500

    # ── Format response in the required output format ─────────────────────────
    return jsonify({
        "Predicted Wait Time": f"{result['predicted_wait_time_minutes']} minutes",
        "Resource Load":        result["resource_load"],
        "Reason":               result["reason"],
        "_breakdown":           result["breakdown"],   # extra detail (internal)
    })


@predict_bp.post("/symptom-check")
def symptom_check():
    """
    Lightweight symptom-based triage.
    Body: { "symptoms": ["headache", "fever", ...] }
    """
    payload = request.get_json(silent=True)
    if not payload or "symptoms" not in payload:
        return jsonify({"error": "'symptoms' list is required"}), 400

    symptoms: list = payload["symptoms"]
    if not isinstance(symptoms, list) or len(symptoms) == 0:
        return jsonify({"error": "'symptoms' must be a non-empty list"}), 400

    # Stub – replace when a trained symptom model is added
    return jsonify({
        "triage": "non-urgent",
        "recommendation": "Consult a general practitioner",
        "confidence": 0.0,
        "note": "Symptom checker model not yet loaded",
    })
