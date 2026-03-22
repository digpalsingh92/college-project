"""
AI Model registry.

How to add a real model
-----------------------
1. Train / serialise the model with joblib:
      joblib.dump(clf, "app/models/saved/my_model.joblib")
2. It will be auto-discovered the next time the app starts.

The model object must expose a `predict(data: dict) -> any` interface
(wrap sklearn or any other library behind this contract).
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import joblib

# ── Model registry (name -> loaded model wrapper) ────────────────────────────
_REGISTRY: dict[str, "ModelWrapper"] = {}
_SAVED_DIR = Path(os.getenv("MODEL_PATH", "app/models/saved"))


class ModelWrapper:
    """Thin wrapper so every model exposes `.predict(data: dict)`."""

    def __init__(self, estimator: Any) -> None:
        self._estimator = estimator

    def predict(self, data: dict | list) -> Any:
        import numpy as np  # lazy import

        if isinstance(data, dict):
            # Convert dict of features to a 2-D array row
            features = list(data.values())
            X = np.array(features, dtype=float).reshape(1, -1)
        else:
            X = np.array(data, dtype=float).reshape(1, -1)

        result = self._estimator.predict(X)
        # Return plain Python types for JSON serialisation
        return result.tolist() if hasattr(result, "tolist") else result


def _load_models() -> None:
    """Scan MODEL_PATH directory and load every .joblib file into the registry."""
    if not _SAVED_DIR.exists():
        _SAVED_DIR.mkdir(parents=True, exist_ok=True)
        return

    for model_file in _SAVED_DIR.glob("*.joblib"):
        model_name = model_file.stem
        try:
            estimator = joblib.load(model_file)
            _REGISTRY[model_name] = ModelWrapper(estimator)
            print(f"[ai-service] Loaded model: {model_name}")
        except Exception as exc:  # noqa: BLE001
            print(f"[ai-service] Failed to load {model_file}: {exc}")


def get_model(name: str) -> ModelWrapper | None:
    if not _REGISTRY:
        _load_models()
    return _REGISTRY.get(name)


# Eager load on import
_load_models()
