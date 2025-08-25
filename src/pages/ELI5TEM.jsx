import { useState, useEffect } from 'react';

export default function ELI5TEM() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/eli5tem');
        if (!res.ok) throw new Error('Bad response');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError('Failed to load.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-3xl font-bold">ELI5TEM</h1>
        {loading && <p>Asking the robots...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {data && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{data.subject}</h2>
            <p>{data.complex}</p>
            <p className="font-semibold">{data.simple}</p>
          </div>
        )}
      </div>
    </div>
  );
}
