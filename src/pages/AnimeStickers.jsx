import { useState } from 'react';

export default function AnimeStickers() {
  const [description, setDescription] = useState('');
  const [pitch, setPitch] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [stickerReady, setStickerReady] = useState(false);

  const fetchSticker = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sticker');
      const data = await res.json();
      setDescription(data.description || '');
      setPitch(data.pitch || '');
      setImage(data.image || '');
      setStickerReady(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    setDescription('');
    setPitch('');
    setImage('');
    setStickerReady(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700 text-white p-4">
      <div className="space-y-6 text-center max-w-xl">
        <h1 className="text-4xl font-extrabold">Anime Sticker of the Day</h1>
        {image && (
          <img src={image} alt="Anime sticker" className="mx-auto rounded-lg w-full max-w-sm" />
        )}
        <p className="text-lg">{description}</p>
        {pitch && <p className="text-lg italic">{pitch}</p>}
        <div className="space-x-4">
          {!stickerReady ? (
            <button
              onClick={fetchSticker}
              disabled={loading}
              className="px-5 py-3 bg-white text-purple-700 font-semibold rounded shadow hover:bg-purple-50 disabled:opacity-50"
            >
              {loading ? 'Finding...' : 'Find My Next Sticker'}
            </button>
          ) : (
            <button
              onClick={handleBuy}
              className="px-5 py-3 bg-white text-purple-700 font-semibold rounded shadow hover:bg-purple-50"
            >
              Buy It Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
