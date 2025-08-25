import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAnonAuth } from "../lib/useAnonAuth";

export default function FirebasePing() {
  const { ready, ensureAnon, user } = useAnonAuth();
  const [status, setStatus] = useState<string>("idle");

  async function ping() {
    setStatus("working…");
    await ensureAnon();
    const uid = user?.uid || "anon";
    const id = Math.random().toString(36).slice(2);
    await setDoc(doc(db, "pings", id), {
      uid,
      at: serverTimestamp(),
      note: "hello from lkw.lol",
    });
    setStatus("wrote doc to /pings");
  }

  return (
    <div className="text-sm flex items-center gap-2">
      <button onClick={ping} className="px-3 py-1 rounded bg-black/10 hover:bg-black/20">
        Firebase ping
      </button>
      <span>{ready ? status : "auth…"} </span>
    </div>
  );
}
