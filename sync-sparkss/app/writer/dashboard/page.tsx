"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";

interface IdeaInboxItem {
  performerName: string;
  performerId: string;
  idea: string;
  submittedAt: string;
}

interface Scene {
  scene: string;
  description: string;
}

interface DeveloperSquad {
  id: string;
  name: string;
}

export default function WriterDashboard() {
  const { user } = useAuth();

  // Local state
  const [ideas, setIdeas] = useState<IdeaInboxItem[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<IdeaInboxItem | null>(null);
  const [aiFlow, setAiFlow] = useState<Scene[]>([]);
  const [developerSquads] = useState<DeveloperSquad[]>([
    { id: "dev1", name: "Team Alpha" },
    { id: "dev2", name: "Team Beta" },
  ]);

  // Initialize ideas from writer inbox
  useEffect(() => {
    if (user?.writer?.ideaInbox) {
      setIdeas(user.writer.ideaInbox);
    }
  }, [user?.writer?.ideaInbox]);

  // Approve / Discard
  const removeIdea = async (idea: IdeaInboxItem, setSelected: boolean) => {
    try {
      const res = await fetch("http://localhost:4000/api/writer/remove-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          writerId: user?.writer?.writerId,
          submittedAt: new Date(idea.submittedAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Remove from local state
      setIdeas((prev) =>
        prev.filter((i) => i.submittedAt !== idea.submittedAt)
      );

      // Set for AI expansion if approving
      if (setSelected) setSelectedIdea(idea);
    } catch (err) {
      console.error(err);
      alert("Failed to process idea");
    }
  };

  const approveIdea = (idea: IdeaInboxItem) => removeIdea(idea, true);
  const discardIdea = (idea: IdeaInboxItem) => removeIdea(idea, false);

const expandWithAI = async () => {
  if (!selectedIdea || !user?.writer?.writerId) return;

  try {
    const res = await fetch("http://localhost:4000/api/writer/expand-idea", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        idea: selectedIdea, 
      }),
    });

    if (!res.ok) throw new Error("Failed to expand idea");

    const data = await res.json();
    if (data.success && Array.isArray(data.aiFlow)) {
      setAiFlow(data.aiFlow);
    } else {
      console.error("Unexpected AI response:", data);
      alert("AI expansion failed");
    }
  } catch (err) {
    console.error(err);
    alert("Error expanding idea with AI");
  }
};


  const updateAiFlow = (index: number, value: string) => {
    const newFlow = [...aiFlow];
    newFlow[index].description = value;
    setAiFlow(newFlow);
  };
  const sendToDeveloper = (devId: string) => {
    alert(`Sent AI flow to ${devId}`);
    setSelectedIdea(null);
    setAiFlow([]);
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden p-8 space-y-10">
      {/* Animated Background */}
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
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold">✍ Writer Dashboard</h1>
        <div className="text-right">
          <p className="text-lg">{user?.name}</p>
          <p className="text-sm text-gray-400">ID: {user?.writer?.writerId}</p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ideas Inbox */}
        <div className="border rounded-xl overflow-y-auto max-h-screen p-4 space-y-3 bg-black/60 border-purple-600/40">
          <h2 className="font-semibold text-xl mb-2">Ideas Inbox</h2>
          {ideas.length === 0 && (
            <p className="text-gray-400">No ideas received.</p>
          )}
          {ideas.map((idea) => (
            <Card
              key={idea.submittedAt}
              className="bg-black/50 border border-purple-600/30"
            >
              <CardHeader>
                <p>{idea.idea}</p>
              </CardHeader>
              <CardContent className="flex justify-between mt-2 text-sm text-gray-300">
                <span>{idea.performerName}</span>
                <div className="flex gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveIdea(idea)}
                  >
                    Approve
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => discardIdea(idea)}
                  >
                    Discard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Expander */}
        <div className="border rounded-xl p-4 space-y-3 bg-black/60 border-blue-600/40">
          <h2 className="font-semibold text-xl mb-2">AI Expander</h2>
          {selectedIdea ? (
            <>
              <p className="mb-2 font-medium">
                Selected Idea: {selectedIdea.idea}
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 mb-4"
                onClick={expandWithAI}
              >
                Expand with AI
              </Button>
              {aiFlow.map((scene, index) => (
                <Card
                  key={index}
                  className="bg-black/50 border border-blue-600/30"
                >
                  <CardHeader>
                    <CardTitle>{scene.scene}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      className="bg-black/40 text-white"
                      value={scene.description}
                      onChange={(e) => updateAiFlow(index, e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <p className="text-gray-400">
              Approve an idea to start AI expansion.
            </p>
          )}
        </div>

        {/* Developer Squads */}
        <div className="border rounded-xl p-4 space-y-3 bg-black/60 border-indigo-600/40">
          <h2 className="font-semibold text-xl mb-2">Developer Squads</h2>
          {developerSquads.map((dev) => (
            <Card
              key={dev.id}
              className="bg-black/50 border border-indigo-600/30"
            >
              <CardHeader>
                <CardTitle>{dev.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 w-full"
                  disabled={aiFlow.length === 0}
                  onClick={() => sendToDeveloper(dev.id)}
                >
                  Send AI Flow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
