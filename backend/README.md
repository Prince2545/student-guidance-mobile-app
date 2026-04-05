# Mentor API (Express proxy)

Serves `POST /api/mentor/chat` and `GET /health`. Secrets only via environment variables (never commit `.env`).

## Render.com

1. Push this repo to GitHub (include the `backend/` folder). `.env` must stay **gitignored**.
2. **New → Web Service** → connect `Prince2545/student-guidance-mobile-app` (or your fork).
3. **Root directory:** `backend`  
4. **Build command:** `npm install`  
5. **Start command:** `npm start`  
6. **Environment** (dashboard → Environment), add as **Secret**:
   - `NVIDIA_API_KEY` — NVIDIA NIM / API key  
   - `MENTOR_APP_KEY` — must match app `EXPO_PUBLIC_MENTOR_APP_KEY`  
   - Optional: `AI_MODEL`  
7. Render sets `PORT` and `RENDER=true` automatically (`trust proxy` enabled for rate limiting).

After deploy, copy the service URL (e.g. `https://student-guidance-mentor-api.onrender.com`).

## Mobile app

Set `EXPO_PUBLIC_MENTOR_BACKEND_URL=https://<your-service>.onrender.com` (no trailing slash) in `student-guidance-app/.env` and in **EAS Environment Variables** for release builds. Rebuild the app.

## Smoke test (local, server running)

```bash
npm run smoke
```
