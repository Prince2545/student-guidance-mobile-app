# Student Guidance — monorepo

React Native (Expo) student app plus a small **mentor API** you can run locally or on Render.

**GitHub:** [Prince2545/student-guidance-mobile-app](https://github.com/Prince2545/student-guidance-mobile-app)

The Expo project lives in **`student-guidance-app/`** (run `cd student-guidance-app` then `npm install` / `npx expo start`).

## App features

- Career discovery (3 phases), daily tasks with proof upload, progress (streak / level / activity), AI Mentor chat, profile / reset.

## Mentor backend (use this)

```bash
cd backend
# Set NVIDIA_API_KEY in .env (see .env.example)
npm start
```

Local default: **`0.0.0.0:5000`**. For a physical phone, use your PC’s LAN IP, not `localhost`.

```bash
cd backend
npm run smoke   # with server running
```

### Deploy API to Render (HTTPS)

See **[backend/README.md](backend/README.md)** and root [`render.yaml`](render.yaml). Set **`NVIDIA_API_KEY`** and **`MENTOR_APP_KEY`** only in the Render dashboard. Point the app at **`EXPO_PUBLIC_MENTOR_BACKEND_URL=https://<your-service>.onrender.com`**.

## Expo app

```bash
cd student-guidance-app
npx expo start
```

## Deprecated

**`mentor-backend/`** is deprecated; use **`backend/`**.

## Security

- NVIDIA keys: **`backend/.env`** only (gitignored). For EAS/APK builds, use **EAS Environment Variables** for `EXPO_PUBLIC_*` — never commit secrets.
- **`MENTOR_APP_KEY`** (backend) must match **`EXPO_PUBLIC_MENTOR_APP_KEY`** (app).

## Repo layout

- `student-guidance-app/` — Expo app (`src/`, `App.tsx`, …)
- `backend/` — Express mentor proxy
- `render.yaml` — optional Render Blueprint

## Automated checks

```bash
cd student-guidance-app && npm run typecheck
```
