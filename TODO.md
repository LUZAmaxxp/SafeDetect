# SafeDetect — Architecture Enhancement Tracker

## Completed

- [x] Root `docker-compose.yml` — all 5 services (zookeeper, kafka, cv-service, ws-bridge, dashboard) in one file
- [x] Root `.env.example` — canonical env-var reference covering all services
- [x] `Makefile` at root — `make setup`, `make up`, `make kafka`, `make dev-cv/bridge/dashboard`, `make test`, `make lint`, `make clean`
- [x] `shared/config.py` — `validate_env_vars()` moved out of module-level; called explicitly by entry point; insecure-key warning added
- [x] `Dashboard_Service/Dockerfile` — replaced webpack dev-server with two-stage build (webpack → nginx)
- [x] `Dashboard_Service/nginx.conf` — serves SPA, proxies `/ws` → ws-bridge, gzip
- [x] `Dashboard_Service/backend_Kafka/Dockerfile` — production Node.js ws-bridge container
- [x] `backend_Python/computer_vision/detection.py` — fixed non-relative import and 5-element bbox unpack bug
- [x] `backend_Python/computer_vision/blind_spot.py` — fixed broken import (legacy file, guarded)
- [x] `Dashboard_Service/src/App.js` — real FPS (rolling window), `camera_zone`-based alert logic, full reconnect handler, dynamic server IP (`window.location.hostname`), settings panel
- [x] README.md — full rewrite with correct service names, ports, folder layout, Makefile targets
- [x] `docs/setup_guide.md`, `docs/integration_guide.md`, `docs/testing_guide.md`, `backend_Python/documents/README.md` — all wrong path references (`backend/`, `web/`) fixed
- [x] Test scaffolding — `backend_Python/tests/` with `conftest.py`, `test_detection.py`, `test_kafka_producer.py`, `test_multi_camera.py`; `pytest.ini` at root
- [x] `.github/workflows/ci-cd.yml` — rebuilt with lint → test → build → push → deploy pipeline; Buildx layer caching; GHCR push on main only

## Remaining / Nice-to-have

- [ ] Push to `main` to trigger CI/CD and verify all workflow jobs pass
- [ ] Add jest config + smoke tests for `WebSocketService.js`
- [ ] GPU passthrough in docker-compose (uncomment `deploy.resources.reservations` block, install `nvidia-container-toolkit`)
- [ ] PulseAudio socket passthrough for in-container audio alerts
- [ ] Upgrade from Zookeeper-backed Kafka to KRaft mode (Confluent 7.6+)

