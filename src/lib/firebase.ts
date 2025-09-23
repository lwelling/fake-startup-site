import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Optional analytics (web only) – guard so builds don’t break on SSR/prerender
let getAnalyticsSafe: (() => any) | undefined;
try {
  // lazy import to avoid bundling analytics if not needed
  getAnalyticsSafe = () => import("firebase/analytics").then(m => m.getAnalytics);
} catch {}

function requireEnv(name: string): string {
  const v = (import.meta as any).env?.[name];
  if (!v) {
    // Don’t crash immediately in production; warn loudly in console
    console.warn(`[firebase] Missing env var: ${name}`);
  }
  return v || "";
}

const config = {
  apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireEnv("VITE_FIREBASE_APP_ID"),
  // measurementId may be blank; that’s okay
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  // Skip initialization if any critical value is missing to avoid runtime crashes.
  if (config.apiKey && config.authDomain && config.projectId && config.appId) {
    app = getApps().length ? getApps()[0]! : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    console.warn(
      "[firebase] Firebase is not configured. Provide the VITE_FIREBASE_* env vars to enable auth & data features."
    );
  }
} catch (error) {
  console.error("[firebase] Failed to initialise Firebase", error);
  app = null;
  auth = null;
  db = null;
  storage = null;
}

const firebaseReady = Boolean(app);

// Optional analytics getter (won’t run on server)
async function analytics() {
  if (
    !firebaseReady ||
    !app ||
    typeof window === "undefined" ||
    !config.measurementId ||
    !getAnalyticsSafe
  )
    return null;
  try {
    const getAnalytics = await getAnalyticsSafe();
    return getAnalytics(app);
  } catch {
    return null;
  }
}

export { app, auth, db, storage, analytics, firebaseReady };
