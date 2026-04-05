/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra ?? {}),
      // Production: set EXPO_PUBLIC_MENTOR_BACKEND_URL (e.g. https://your-api.onrender.com). LAN fallback for local dev.
      mentorBackendUrl:
        process.env.EXPO_PUBLIC_MENTOR_BACKEND_URL ||
        process.env.MENTOR_BACKEND_URL ||
        'http://192.168.31.161:5000',
      // Must exactly match backend MENTOR_APP_KEY (set in student-guidance-app/.env — no fallback).
      mentorAppKey: (process.env.EXPO_PUBLIC_MENTOR_APP_KEY || '').trim(),
    },
  },
};
