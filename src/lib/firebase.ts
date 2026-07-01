import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export function getFirebase() {
  if (typeof window === "undefined") {
    throw new Error("Firebase is client-only");
  }
  if (!_app) {
    _app = getApps()[0] ?? initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    _storage = getStorage(_app);
  }
  return { app: _app!, auth: _auth!, db: _db!, storage: _storage! };
}

// Default admin credentials (seeded on first login attempt).
export const DEFAULT_ADMIN = {
  username: "Shah123",
  password: "7388739691.sa",
};

// Shared read-only visitor account (seeded on first "Continue as Visitor").
export const VISITOR_ACCOUNT = {
  username: "visitor",
  password: "visitor-jago-2026-readonly",
};

export const USERNAME_DOMAIN = "jagotravels.local";

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;
}

export const VISITOR_EMAIL = usernameToEmail(VISITOR_ACCOUNT.username);