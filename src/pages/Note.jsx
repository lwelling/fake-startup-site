import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit, startAfter, getDocs, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function Note() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef(null);

  const pageSize = 10;

  const loadNotes = useCallback(async () => {
    if (loading || !user || !hasMore) return;
    setLoading(true);
    let q = query(
      collection(db, 'users', user.uid, 'notes'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    if (lastDoc) {
      q = query(
        collection(db, 'users', user.uid, 'notes'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }
    const snap = await getDocs(q);
    const newNotes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setNotes((prev) => [...prev, ...newNotes]);
    setLastDoc(snap.docs[snap.docs.length - 1]);
    if (snap.docs.length < pageSize) setHasMore(false);
    setLoading(false);
  }, [user, lastDoc, loading, hasMore]);

  useEffect(() => {
    setNotes([]);
    setLastDoc(null);
    setHasMore(true);
    loadNotes();
  }, [user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNotes();
        }
      },
      { threshold: 1 }
    );
    const current = loader.current;
    if (current) observer.observe(current);
    return () => current && observer.unobserve(current);
  }, [loadNotes]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (editingId) {
      const ref = doc(db, 'users', user.uid, 'notes', editingId);
      await updateDoc(ref, { text: trimmed, updatedAt: serverTimestamp() });
      setNotes((prev) =>
        prev.map((n) => (n.id === editingId ? { ...n, text: trimmed } : n))
      );
      setEditingId(null);
    } else {
      const ref = await addDoc(collection(db, 'users', user.uid, 'notes'), {
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      setNotes((prev) => [{ id: ref.id, text: trimmed, createdAt: new Date() }, ...prev]);
    }
    setText('');
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  const startX = useRef(0);
  const [swipedId, setSwipedId] = useState(null);

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(id, e) {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 50) setSwipedId(id);
    if (diff < -50) setSwipedId(null);
  }

  function startEdit(note) {
    setEditingId(note.id);
    setText(note.text);
    setSwipedId(null);
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note..."
          className="w-full p-2 border rounded mb-2"
          rows={3}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {editingId ? 'Update' : 'Add'} Note
        </button>
      </form>
      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 flex">
              <button
                type="button"
                onClick={() => startEdit(note)}
                className="w-16 bg-green-500 text-white"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                className="w-16 bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
            <div
              className={`relative z-10 transition-transform duration-300 ${
                swipedId === note.id ? '-translate-x-32' : ''
              }`}
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(note.id, e)}
            >
              <div className="bg-white p-4 shadow rounded w-full">
                {note.text}
              </div>
            </div>
          </div>
        ))}
        {hasMore && (
          <div ref={loader} className="h-10 flex items-center justify-center">
            {loading && 'Loading...'}
          </div>
        )}
      </div>
    </div>
  );
}

