/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const appJson = require('./app.json');

/** Production mentor API (Render). Override with EXPO_PUBLIC_MENTOR_BACKEND_URL for a different host or LAN dev. */
const DEFAULT_MENTOR_BACKEND_URL = 'https://student-guidance-mobile-app.onrender.com';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra ?? {}),
      // Primary: EXPO_PUBLIC_MENTOR_BACKEND_URL → then MENTOR_BACKEND_URL → Render default (no localhost/LAN in repo defaults).
      mentorBackendUrl:
        process.env.EXPO_PUBLIC_MENTOR_BACKEND_URL ||
        process.env.MENTOR_BACKEND_URL ||
        DEFAULT_MENTOR_BACKEND_URL,
      // Must exactly match backend MENTOR_APP_KEY (set in student-guidance-app/.env — no fallback).
      mentorAppKey: (process.env.EXPO_PUBLIC_MENTOR_APP_KEY || '').trim(),
    },
  },
};
