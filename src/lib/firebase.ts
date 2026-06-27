import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCYZsTVRLFfS-ZXiOxVr-doxEVaA-g5FTg",
  authDomain: "jago-travels-9eaac.firebaseapp.com",
  projectId: "jago-travels-9eaac",
  storageBucket: "jago-travels-9eaac.firebasestorage.app",
  messagingSenderId: "589806974613",
  appId: "1:589806974613:web:f0272053705df2a5244d9c",
  measurementId: "G-WEEMPQ0M2Q",
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

export const USERNAME_DOMAIN = "jagotravels.local";

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;
}
