import { useState, useEffect } from "react";

function generateNoise(level) {
  const chars = "!@#$%^&*()_+-=[]{}|;:'\"<>,.?/";
  let out = "";
  for (let i = 0; i < level * 20; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function distortText(text, level) {
  const chars = "!@#$%^&*()_+-=[]{}|;:'\"<>,.?/";
  return text
    .split("")
    .map((c) =>
      Math.random() < level * 0.05
        ? c + chars[Math.floor(Math.random() * chars.length)]
        : c
    )
    .join("");
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
    console.log("escalate count: ", escalateCount);
    console.log("expected: ", expected);
    console.log("reply: ", reply);
  }, [escalateCount, expected, reply]);

  useEffect(() => {
    const allClasses = [
      "phase-1",
      "phase-2",
      "phase-3",
      "phase-4",
      "phase-5",
      "static-flicker",
      "severe-static",
      "meltdown",
      "strobe",
    ];
    document.body.classList.remove(...allClasses);
    document.body.style.background = "";
    delete document.body.dataset.noise;

    if (escalateCount >= 1 && escalateCount <= 5) {
      document.body.classList.add(`phase-${escalateCount}`);
      if (escalateCount >= 3) {
        document.body.classList.add("static-flicker");
      }
      if (escalateCount >= 4) {
        document.body.dataset.noise = generateNoise(escalateCount * 2);
      }
      if (escalateCount === 5) {
        document.body.classList.add("meltdown", "severe-static");
      }
    }

    if (escalateCount === 6) {
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
      const distortedReply =
        level >= 2 ? distortText(data.reply || "", level) : data.reply || "";
      setReply(distortedReply);
      const expList = [data.expected1, data.expected2, data.expected3].filter(
        Boolean
      );
      const distortedExp =
        level >= 2 ? expList.map((e) => distortText(e, level)) : expList;
      setExpected(distortedExp);
      if (level > 0 && level < 6) {
        const indices = [];
        expList.forEach((_, i) => {
          if (level >= 5 || Math.random() < 0.5) indices.push(i);
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
    if (escalateCount === 5) {
      setEscalateCount(6); // just trigger the meltdown
      return;
    }

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
          Error 480: Max Number of Realities Exceeded
        </p>
        <button onClick={handleReset} className="border px-4 py-2 bg-white">
          let's start from the beginning
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-400 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="space-y-6 max-w-xl w-full z-10">
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

        {loading && (
          <div
            className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center transition-all duration-300
      ${
        escalateCount >= 5
          ? "bg-red-900 strobe severe-static"
          : escalateCount === 4
          ? "bg-black bg-opacity-95 static-flicker"
          : escalateCount === 3
          ? "bg-black bg-opacity-90 static-flicker"
          : escalateCount === 2
          ? "bg-black bg-opacity-75"
          : "bg-black bg-opacity-60"
      }
    `}
          >
            <span
              className={`text-gray-200 tracking-widest animate-pulse text-xl
        ${
          escalateCount >= 5
            ? "text-4xl rotate-6 blur-sm"
            : escalateCount === 4
            ? "text-3xl blur-[1px]"
            : escalateCount === 3
            ? "text-2xl"
            : "text-xl"
        }
      `}
            >
              ▊▓▒░ Loading Reality ░▒▓▊
            </span>
          </div>
        )}

        {!loading && reply && (
          <div className="bg-gray-900 p-4 rounded shadow-lg text-center space-y-4">
            <h2
              data-text={reply}
              className={`text-green-400 text-2xl ${
                escalateCount >= 5 ? "glitch" : ""
              }`}
            >
              {reply}
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {expected.map((e, i) => {
                const colors = [
                  "text-purple-300 hover:text-purple-500",
                  "text-blue-300 hover:text-blue-500",
                  "text-pink-300 hover:text-pink-500",
                ];
                const wavy = wavyIndices.includes(i)
                  ? `flicker ${escalateCount >= 5 ? "random-size" : ""}`
                  : "";
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
