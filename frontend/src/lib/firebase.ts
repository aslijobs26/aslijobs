import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebaseOptions } from "./firebase-config";

/** The single Firebase app, or null when the web app config is incomplete. */
export function getFirebaseApp(): FirebaseApp | null {
  const options = getFirebaseOptions();
  if (!options) {
    return null;
  }
  return getApps().length > 0 ? getApp() : initializeApp(options);
}
