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
import {
  getFirebase,
  DEFAULT_ADMIN,
  VISITOR_ACCOUNT,
  VISITOR_EMAIL,
  usernameToEmail,
} from "./firebase";

export type Role = "admin" | "visitor";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  username: string | null;
  role: Role | null;
  isAdmin: boolean;
  isVisitor: boolean;
  signIn: (username: string, password: string, remember: boolean) => Promise<void>;
  signInAsVisitor: () => Promise<void>;
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

function roleForEmail(email: string | null | undefined): Role | null {
  if (!email) return null;
  return email.toLowerCase() === VISITOR_EMAIL ? "visitor" : "admin";
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

  async function bootstrapAndSignIn(
    email: string,
    password: string,
    canBootstrap: boolean,
  ) {
    const { auth } = getFirebase();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (
        canBootstrap &&
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

  async function signIn(username: string, password: string, remember: boolean) {
    const { auth } = getFirebase();
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    const trimmed = username.trim().toLowerCase();
    // Do not allow logging in as the visitor account through the admin form.
    if (trimmed === VISITOR_ACCOUNT.username.toLowerCase()) {
      throw new Error("Invalid username or password");
    }
    const email = usernameToEmail(username);
    const isDefault =
      trimmed === DEFAULT_ADMIN.username.toLowerCase() &&
      password === DEFAULT_ADMIN.password;
    await bootstrapAndSignIn(email, password, isDefault);
  }

  async function signInAsVisitor() {
    const { auth } = getFirebase();
    await setPersistence(auth, browserSessionPersistence);
    await bootstrapAndSignIn(VISITOR_EMAIL, VISITOR_ACCOUNT.password, true);
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
    if (roleForEmail(current.email) !== "admin") {
      throw new Error("Only admins can change credentials");
    }
    // Re-authenticate by signing in again.
    await signInWithEmailAndPassword(auth, current.email, currentPassword);
    if (newUsername && newUsername.trim()) {
      if (newUsername.trim().toLowerCase() === VISITOR_ACCOUNT.username.toLowerCase()) {
        throw new Error("This username is reserved");
      }
      await updateEmail(current, usernameToEmail(newUsername));
    }
    if (newPassword && newPassword.length > 0) {
      await updatePassword(current, newPassword);
    }
  }

  const role = roleForEmail(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        username: emailToUsername(user?.email ?? null),
        role,
        isAdmin: role === "admin",
        isVisitor: role === "visitor",
        signIn,
        signInAsVisitor,
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
