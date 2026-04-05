# Project Experience 2

Student guidance Expo app + LAN mentor proxy.

## Mentor backend (use this)

Run **`backend/`** only:

```bash
cd backend
# Set NVIDIA_API_KEY in .env (see .env.example)
npm start
```

Listens on **`0.0.0.0:5000`**. The mobile app must call your PC’s **Wi‑Fi IP** (not `localhost`), e.g. `http://192.168.x.x:5000`.

Smoke test (server must already be running):

```bash
cd backend
npm run smoke
```

### Deploy API to Render (HTTPS)

See **[backend/README.md](backend/README.md)**. Optional Blueprint: [`render.yaml`](render.yaml) (root directory `backend`, `npm install` / `npm start`). Set **`NVIDIA_API_KEY`** and **`MENTOR_APP_KEY`** only in the Render dashboard. Then set the app’s **`EXPO_PUBLIC_MENTOR_BACKEND_URL`** to `https://<your-service>.onrender.com`.

## Expo app

```bash
cd student-guidance-app
# Optional: MENTOR_BACKEND_URL=http://YOUR_PC_IP:5000 in .env
npx expo start
```

Phone and PC must be on the **same Wi‑Fi** when using the mentor on a physical device.

## Deprecated

The **`mentor-backend/`** folder is **deprecated**; use **`backend/`** instead.

## Security

- NVIDIA / API keys belong only in **`backend/.env`** (listed in **`backend/.gitignore`**). Do not commit `.env`.
- Do not put NVIDIA keys in `student-guidance-app` env vars for production builds.
- The mentor API is **rate limited** (20 requests / minute / IP on `POST /api/mentor/chat`).
- Set **`MENTOR_APP_KEY`** in `backend/.env` and the **same** value as **`EXPO_PUBLIC_MENTOR_APP_KEY`** in `student-guidance-app/.env`. The app sends header **`x-app-key`** on every mentor request. If they differ or either is empty, you get **`403`** with `{ error: "AI unavailable" }`.

## Manual E2E (Mentor)

1. Start backend with a valid `NVIDIA_API_KEY` in `backend/.env`.
2. `cd backend && npm run smoke` (with server running) — expect `/health` ok.
3. Start Expo; open Mentor; send a message — expect a normal reply.
4. Backend terminal should show `incoming request` and `NVIDIA response`.

## Automated checks (app)

From `student-guidance-app`: `npm run typecheck`

## Branding

The provided logo is copied into `student-guidance-app/assets/` as `brand-source.png` and used for `icon.png`, `splash-icon.png`, `adaptive-icon.png`, and `favicon.png`. For store submission, regenerate exact sizes with [Expo app icon / splash docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) if the build pipeline warns about dimensions.
