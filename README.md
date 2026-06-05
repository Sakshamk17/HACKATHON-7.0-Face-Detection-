# Offline Face Auth (Hackathon 7.0)

Offline-first face authentication system with:
- A React Native mobile app (`frontend/`)
- A Python HTTP backend + SQLite event storage (`backend/`)
- An offline ML pipeline for face detection, embedding, liveness, and recognition (`offline-face-auth/`)

## Project Structure

```text
frontend/           React Native mobile application
backend/            Python API server and SQLite data layer
offline-face-auth/  Python ML scripts/models for face auth
```

## Features

- Local enrollment and verification flow
- Liveness-aware verification path
- On-device/offline-oriented architecture
- SQLite-backed auth event and sync queue storage
- Modular frontend (screens, hooks, store, ML/liveness core)

## Prerequisites

### General
- Node.js >= 22.11.0 (required by frontend)
- npm (or yarn)
- Python 3.10+
- Git

### For React Native
- Android Studio (for Android builds)
- Xcode + CocoaPods (for iOS builds on macOS)

## Setup

## 1) Frontend (React Native)

```bash
cd frontend
npm install
```

Run Metro:

```bash
npm start
```

Run Android:

```bash
npm run android
```

Run iOS:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

Run tests:

```bash
npm test
```

## 2) Backend (Python API)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

Backend default endpoint:
- `http://0.0.0.0:8080`

Health check:
- `GET /health`

Main API routes:
- `POST /enroll`
- `POST /verify`

## 3) Offline ML Module

The backend imports ML utilities from `offline-face-auth/`.

Expected model assets:
- `offline-face-auth/models/mobilefacenet.pt`
- `offline-face-auth/models/mobilefacenet_scripted.pt`

ML scripts are available for standalone workflows such as:
- `enroll.py`
- `verify.py`
- `recognize.py`
- `liveness.py`

## Data and Storage

- Backend SQLite DB path: `backend/db/faceid.db`
- Tables include:
  - `users`
  - `embeddings`
  - `auth_events`
  - `sync_queue`

## Notes

- `frontend/README.md` currently contains the default React Native template docs.
- This root README is the project-level source of truth.

## Troubleshooting

- If `npm install` fails with ENOSPC, free disk space and retry.
- If iOS pods fail, ensure Ruby bundler and CocoaPods are installed.
- If backend face inference fails, verify model files exist under `offline-face-auth/models/`.
