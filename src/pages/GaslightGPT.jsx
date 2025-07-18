import { useState, useEffect } from "react";

function generateNoise(level) {
  const chars = "!@#$%^&*()_+-=[]{}|;:'\"<>,.?/";
  let out = "";
  for (let i = 0; i < level * 20; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function GaslightGPT() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [expected, setExpected] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstInteraction, setFirstInteraction] = useState(true);
  const [escalateCount, setEscalateCount] = useState(0);
  const [showError, setShowError] = useState(false);
  const [wavyIndices, setWavyIndices] = useState([]);

  useEffect(() => {
    const allClasses = [
      "phase-1",
      "phase-2",
      "phase-3",
      "phase-4",
      "phase-5",
      "disrupt-1",
      "disrupt-2",
      "disrupt-3",
      "disrupt-4",
      "static-flicker",
      "meltdown",
    ];
    document.body.classList.remove(...allClasses);
    document.body.style.background = "";

    if (escalateCount >= 1 && escalateCount <= 4) {
      document.body.classList.add(`disrupt-${escalateCount}`);
      document.body.classList.add(`phase-${escalateCount}`);
      document.body.dataset.noise = generateNoise(escalateCount);
      if (escalateCount >= 3) {
        document.body.classList.add("static-flicker");
      }
    }

    if (escalateCount === 5) {
      document.body.classList.add("meltdown", "phase-5");
      document.body.style.background = "white";
      delete document.body.dataset.noise;
      setShowError(true);
    }

    return () => {
      document.body.classList.remove(...allClasses);
      document.body.style.background = "";
      delete document.body.dataset.noise;
    };
  }, [escalateCount]);

  const sendRequest = async (message, level) => {
    try {
      setLoading(true);
      const res = await fetch("/api/gaslight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: message, n: level }),
      });
      const data = await res.json();
      setReply(data.reply || "");
      const expList = [
        data.expected1,
        data.expected2,
        data.expected3,
      ].filter(Boolean);
      setExpected(expList);
      if (level > 0 && level < 5) {
        const indices = [];
        expList.forEach((_, i) => {
          if (Math.random() < 0.5) indices.push(i);
        });
        setWavyIndices(indices);
      } else {
        setWavyIndices([]);
      }
      setSources(data.sources || []);
      setEscalateCount(level);
    } catch (err) {
      console.error(err);
      setReply("Hmm. That’s strange.");
    } finally {
      setLoading(false);
      setFirstInteraction(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEscalateCount(0);
    await sendRequest(input, 0);
  };

  const handleEscalate = async () => {
    if (escalateCount < 5) {
      await sendRequest(input, escalateCount + 1);
    }
  };

  const handleReset = () => {
    setInput("");
    setReply("");
    setExpected([]);
    setSources([]);
    setWavyIndices([]);
    setEscalateCount(0);
    setShowError(false);
    setFirstInteraction(true);
  };

  if (showError) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-700 flex flex-col items-center justify-center p-6">
        <div className="text-7xl mb-4">:(</div>
        <p className="mb-6 text-center max-w-md">
          Chrome ran out of memory while trying to display this page.
        </p>
        <button onClick={handleReset} className="border px-4 py-2 bg-white">
          restart
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-400 flex items-center justify-center p-4">
      <div className="space-y-6 max-w-xl w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <span className="font-bold">Gaslight</span>
            <span className="font-thin">GPT</span>
          </h1>
        </div>

        {firstInteraction && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what happened..."
              className="w-full p-3 rounded text-gray-900"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full py-3 bg-green-700 text-black rounded font-semibold hover:bg-green-600 transition animate-flicker"
            >
              {loading ? "Thinking..." : "Validate My Reality"}
            </button>
          </form>
        )}

        {loading && <div className="text-center animate-pulse">Loading...</div>}

        {!loading && reply && (
          <div className="bg-gray-900 p-4 rounded shadow-lg text-center space-y-4">
            <h2 className="text-green-400 text-2xl">{reply}</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {expected.map((e, i) => {
                const colors = [
                  "text-purple-300 hover:text-purple-500",
                  "text-blue-300 hover:text-blue-500",
                  "text-pink-300 hover:text-pink-500",
                ];
                const wavy = wavyIndices.includes(i) ? "wavy" : "";
                return (
                  <button
                    key={i}
                    onClick={handleEscalate}
                    className={`underline ${
                      escalateCount >= 4 ? "whitespace-nowrap" : ""
                    } ${colors[i % colors.length]} ${wavy}`}
                  >
                    {e}
                  </button>
                );
              })}
              {!expected && (
                <button onClick={handleEscalate}>
                  Why won't you listen to me...
                </button>
              )}
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="bg-gray-800 p-4 rounded text-green-200">
            <h3 className="mb-2">Sources</h3>
            <ul className="list-disc list-inside text-sm">
              {sources.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
