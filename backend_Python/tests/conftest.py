"""
pytest configuration — sets required environment variables before any module
that imports shared.config is loaded, so KAFKA_HOST/KAFKA_PORT are always
present and validate_env_vars() (called explicitly by entry points) won't
raise during testing.
"""
import os
import pytest


def pytest_configure(config):
    """Set bare-minimum env vars needed by shared.config at import time."""
    os.environ.setdefault("KAFKA_HOST", "localhost")
    os.environ.setdefault("KAFKA_PORT", "29092")
    os.environ.setdefault("KAFKA_TOPIC", "detections")
    os.environ.setdefault("DETECTION_SECRET_KEY", "test_secret_key_do_not_use")
