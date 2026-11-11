import type { FirebaseOptions } from "firebase/app";

/**
 * Next.js inlines a NEXT_PUBLIC_* value only where the full variable name is
 * written out, so each one is read literally here.
 */
const configuredOptions: FirebaseOptions = {
  apiKey: readValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: readValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: readValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: readValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readValue(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: readValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: readValue(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
};

const REQUIRED_FOR_ANALYTICS = [
  "apiKey",
  "projectId",
  "appId",
  "measurementId",
] as const;

function readValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** The web app config, or null when a value Analytics needs is missing. */
export function getFirebaseOptions(): FirebaseOptions | null {
  return REQUIRED_FOR_ANALYTICS.every((key) => configuredOptions[key])
    ? configuredOptions
    : null;
}
