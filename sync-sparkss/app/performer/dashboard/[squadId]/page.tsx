"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { Mic, Search } from "lucide-react";

type Idea = {
  _id: string;
  text: string;
  createdBy: { name: string; nickname: string };
  createdAt: string;
};

interface AiResult {
  title: string;
  text: string;
  bullets: string[];
  raw?: string;
  createdAt?: string;
  createdBy?: string;
}

type Writer = {
  _id: string;
  name: string;
  nickname: string;
};

type Squad = {
  _id: string;
  name: string;
  description?: string;
  performers: string[];
  ideas: Idea[];
  aiSummary?: { text: string; createdAt: string };
  aiExpansion?: { text: string; createdAt: string };
  aiMindMap?: { data: any; createdAt: string };
};

export default function SquadDashboard() {
  const params = useParams();
  const squadId = params?.squadId as string;
  const { user, loading, isAuthenticated } = useAuth();

  const [squad, setSquad] = useState<Squad | null>(null);
  const [newIdea, setNewIdea] = useState("");
  const [writers, setWriters] = useState<Writer[]>([]);
  const [listening, setListening] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);

  // Voice input
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewIdea((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.start();
  };

  // Fetch squad
  useEffect(() => {
    const fetchSquad = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/performer/squads/${squadId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (res.ok) {
          setSquad(data);
          setIdeas(data.ideas || []);
        }
      } catch (err) {
        console.error("Error fetching squad:", err);
      }
    };
    if (squadId) fetchSquad();
  }, [squadId]);

  // Fetch writers
  useEffect(() => {
    const fetchWriters = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/writers", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setWriters(data);
      } catch (err) {
        console.error("Error fetching writers:", err);
      }
    };
    fetchWriters();
  }, []);

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!isAuthenticated || !user)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white">
        <p className="mb-4">You are not logged in.</p>
      </div>
    );

  // Add new idea
  const handleAddIdea = async () => {
    if (!newIdea.trim() || !squad) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/performer/squads/${squadId}/idea`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: newIdea }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSquad({ ...squad, ideas: [...squad.ideas, data] });
        setIdeas((prev) => [...prev, data]);
        setNewIdea("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Search ideas
  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(
        `http://localhost:4000/api/performer/squads/search-ideas?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok) {
        setIdeas(data.ideas || []);
        const normalizedIdeas = data.ideas.map((i: any) => ({
          _id: i._id || `${i.squadId}-${i.createdAt}`,
          text: i.ideaText,
          createdBy: i.createdBy,
          createdAt: i.createdAt,
          category: i.category,
        }));
        setIdeas(normalizedIdeas);
      } else console.error("Error fetching ideas:", data.message);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Summarize AI
  const handleSummarize = async () => {
    if (!squad) return;
    const countStr = prompt("How many last ideas do you want to summarize?");
    if (!countStr) return;
    const count = parseInt(countStr);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid number");
      return;
    }
    const lastIdeas = squad.ideas.slice(-count).map((idea) => idea.text);
    try {
      const res = await fetch(
        `http://localhost:4000/api/performer/squads/${squad._id}/summarize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ideas: lastIdeas }),
        }
      );
      const data = await res.json();
      if (res.ok) setAiResult(data.summary);
      else alert(data.message || "Failed to summarize");
    } catch (err) {
      console.error("Error summarizing:", err);
    }
  };

  const handleMindMap = async () => {
    // Placeholder
  };

  const handleExpand = async () => {
    // Placeholder
  };

  const handleShare = (writerId: string) => {
    alert(`Shared idea with writer ${writerId} (placeholder)`);
  };

  return (
    <div className="min-h-screen text-white p-6 relative">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 -z-10 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-30"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              background: `hsl(${i * 60}, 70%, 60%)`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 12 + i * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-purple-700 pb-4">
        <h1 className="text-2xl font-bold">🎭 SyncSparks</h1>
        <div className="text-right">
          <p className="text-lg">{user.name}</p>
          <p className="text-gray-400 text-sm">{user.nickname}</p>
        </div>
      </header>

      {/* Squad Info */}
      {squad && (
        <div className="mb-8 flex justify-center">
          <div className="max-w-xl text-center">
            <h2 className="text-3xl font-bold">{squad.name}</h2>
            <p className="text-gray-400">
              {squad.description || "No description"}
            </p>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section 1: Ideas */}
        <motion.div
          className="bg-black/50 rounded-xl p-4 border border-purple-600/40 flex flex-col h-[calc(100vh-12rem)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-semibold mb-3">💭 Ideas</h3>

          {/* Search */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Search ideas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-24"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-24"
            />
            <Button
              onClick={handleSearch}
              className="bg-purple-600 hover:bg-purple-700 flex items-center"
            >
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
          </div>

          {/* Ideas list */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {ideas.length === 0 ? (
              <p>No ideas found.</p>
            ) : (
              ideas.map((idea) => (
                <div key={idea._id} className="p-3 rounded-lg bg-purple-800/30">
                  <p>{idea.text || idea.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {idea.createdBy?.nickname || idea.createdBy?.name} ·{" "}
                    {new Date(idea.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Input row */}
          <div className="flex gap-2">
            <Input
              placeholder="Type an idea..."
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
            />
            <Button
              type="button"
              onClick={startListening}
              className={`${
                listening
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleAddIdea}
            >
              ➕
            </Button>
          </div>
        </motion.div>

        {/* Section 2: AI Workspace */}
        <motion.div
          className="bg-black/50 rounded-xl p-4 border border-purple-600/40 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-semibold mb-3">🤖 AI Workspace</h3>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleSummarize}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Summarize
            </Button>
            <Button
              onClick={handleMindMap}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Mind Map
            </Button>
            <Button
              onClick={handleExpand}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Expand
            </Button>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-purple-900/20 overflow-y-auto whitespace-pre-wrap text-white">
            {aiResult ? (
              <div>
                <h2 className="text-lg font-semibold mb-2">{aiResult.title}</h2>
                <p className="mb-3">{aiResult.text}</p>
                {aiResult.bullets?.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {aiResult.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No AI output yet</p>
            )}
          </div>
        </motion.div>

        {/* Section 3: Writers */}
        <motion.div
          className="bg-black/50 rounded-xl p-4 border border-purple-600/40 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-semibold mb-3">✍️ Writers</h3>
          <div className="space-y-3">
            {writers.map((writer) => (
              <Card
                key={writer._id}
                className="bg-purple-900/20 border-purple-600/40"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{writer.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <p className="text-sm text-gray-400">{writer.nickname}</p>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleShare(writer._id)}
                  >
                    Share
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
