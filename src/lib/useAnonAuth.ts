import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";

export function useAnonAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  async function ensureAnon() {
    if (!auth.currentUser) await signInAnonymously(auth);
    return auth.currentUser;
  }

  return { user, ready, ensureAnon };
}
