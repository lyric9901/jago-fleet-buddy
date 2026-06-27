import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  updateEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
} from "firebase/auth";
import { getFirebase, DEFAULT_ADMIN, usernameToEmail } from "./firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  username: string | null;
  signIn: (username: string, password: string, remember: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
  changeCredentials: (opts: {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function emailToUsername(email: string | null) {
  if (!email) return null;
  return email.split("@")[0];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebase();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function signIn(username: string, password: string, remember: boolean) {
    const { auth } = getFirebase();
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    const email = usernameToEmail(username);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // Bootstrap the default admin on first launch.
      const isDefault =
        username.trim().toLowerCase() ===
          DEFAULT_ADMIN.username.toLowerCase() &&
        password === DEFAULT_ADMIN.password;
      if (
        isDefault &&
        (error.code === "auth/user-not-found" ||
          error.code === "auth/invalid-credential" ||
          error.code === "auth/invalid-login-credentials")
      ) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          return;
        } catch (createErr: unknown) {
          const ce = createErr as { code?: string };
          if (ce.code === "auth/email-already-in-use") {
            throw new Error("Invalid username or password");
          }
          throw createErr;
        }
      }
      throw new Error("Invalid username or password");
    }
  }

  async function signOutUser() {
    const { auth } = getFirebase();
    await signOut(auth);
  }

  async function changeCredentials({
    currentPassword,
    newUsername,
    newPassword,
  }: {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
  }) {
    const { auth } = getFirebase();
    const current = auth.currentUser;
    if (!current?.email) throw new Error("Not signed in");
    // Re-authenticate by signing in again.
    await signInWithEmailAndPassword(auth, current.email, currentPassword);
    if (newUsername && newUsername.trim()) {
      await updateEmail(current, usernameToEmail(newUsername));
    }
    if (newPassword && newPassword.length > 0) {
      await updatePassword(current, newPassword);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        username: emailToUsername(user?.email ?? null),
        signIn,
        signOutUser,
        changeCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
