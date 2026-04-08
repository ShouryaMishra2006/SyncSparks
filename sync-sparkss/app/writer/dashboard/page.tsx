"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";

interface IdeaInboxItem {
  performerName: string;
  performerId: string;
  idea: string;
  submittedAt: string;
  genre: string;
}

interface Scene {
  scene: string;
  description: string;
}

interface DeveloperSquad {
  _id: string;
  name: string;
  inviteCode: string;
}

export default function WriterDashboard() {
  const { user } = useAuth();
  
  console.log(user)
  const [ideas, setIdeas] = useState<IdeaInboxItem[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<IdeaInboxItem[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<IdeaInboxItem | null>(null);
  const [aiFlow, setAiFlow] = useState<Scene[]>([]);
  const [developerSquads, setDeveloperSquads] = useState<DeveloperSquad[]>([]);
  const [searchCode, setSearchCode] = useState<string>("");
  const [searchedSquad, setSearchedSquad] = useState<DeveloperSquad | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>("All");
  // Initialize ideas from writer inbox
  useEffect(() => {
    if (user?.writer?.ideaInbox) {
      setIdeas(user.writer.ideaInbox);
      console.log("ideas for inbox",ideas)
    }
  }, [user?.writer?.ideaInbox]);


  // ===============================
  //  WEBSOCKET (REAL-TIME)
  // ===============================
  useEffect(() => {
    const writerId = user?.writer?.writerId;

    if (!writerId) return;


   // if (!user?.writer?.writerId || !user?._id || !user?.name) return;

    const socket = new WebSocket(
      `ws://localhost:4000/yjs?sessionId=writerInbox&userId=${user._id}&userName=${user.name}`
    );

    socket.onopen = () => {
      console.log("✅ WS Connected");

      socket.send(
        JSON.stringify({
          type: "register-writer",
          writerId,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "new-idea") {
          setIdeas((prev) => {
            //  avoid duplicates
            if (
              prev.some(
                (i) => i.submittedAt === data.data.submittedAt
              )
            ) {
              return prev;
            }
            return [data.data, ...prev];
          });
        }
      } catch {
        // ignore YJS binary
      }
    };

    socket.onclose = () => console.log("❌ WS Closed");
    socket.onerror = (err) => console.error("WS Error:", err);

    return () => socket.close();
  }, [user]);



  // Fetch all developer squads
  const fetchAllDeveloperSquads = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/developer/squads", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setDeveloperSquads(data.squads);
    } catch (err) {
      console.error("Failed to fetch developer squads:", err);
    }
  };

  useEffect(() => {
    fetchAllDeveloperSquads();
  }, []);

  // Filter ideas by selected genre
  useEffect(() => {
    if (genreFilter === "All") setFilteredIdeas(ideas);
    else setFilteredIdeas(ideas.filter((idea) => idea.genre === genreFilter));
  }, [genreFilter, ideas]);


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

      setIdeas((prev) =>
        prev.filter((i) => i.submittedAt !== idea.submittedAt)
      );

      if (setSelected) setSelectedIdea(idea);
    } catch (err) {
      console.error(err);
      alert("Failed to process idea");
    }
  };

  const approveIdea = (idea: IdeaInboxItem) => removeIdea(idea, true);
  const discardIdea = (idea: IdeaInboxItem) => removeIdea(idea, false);

  const expandWithAI = async () => {
    if (!selectedIdea) return;
    try {
      const res = await fetch("http://localhost:4000/api/writer/expand-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idea: selectedIdea }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.aiFlow)) setAiFlow(data.aiFlow);
      else alert("AI expansion failed");
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

  const sendToDeveloper = async (devId: string) => {
    if (!selectedIdea) return;
    try {
      const res = await fetch("http://localhost:4000/api/developer/send-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ squadId: devId, idea: selectedIdea.idea, aiFlow }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Request sent successfully!");
        setSelectedIdea(null);
        setAiFlow([]);
      } else {
        alert("Failed to send idea");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send idea");
    }
  };

  const searchByInviteCode = async () => {
    if (!searchCode) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/developer/squads/search?code=${searchCode}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setSearchedSquad(data.squad);
      else setSearchedSquad(null);
    } catch (err) {
      console.error(err);
    }
  };
    const genres = Array.from(new Set(ideas.map((i) => i.genre).filter(Boolean))) as string[];


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
            transition={{ repeat: Infinity, duration: 12 + i * 2, ease: "easeInOut" }}
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
  <div className="flex justify-between items-center mb-2">
    <h2 className="font-semibold text-xl">Ideas Inbox</h2>

    {/* Genre Filter */}
    <Select value={genreFilter} onValueChange={setGenreFilter}>
      <SelectTrigger className="w-40 bg-black/50 border-gray-600 text-white">
        <SelectValue placeholder="Filter by genre" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">All</SelectItem>
        {Array.from(new Set(ideas.map((i) => i.genre).filter(Boolean))).map((g) => (
          <SelectItem key={g} value={g}>
            {g}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {(genreFilter === "All" ? ideas : ideas.filter((i) => i.genre === genreFilter)).map((idea) => (
    <Card key={idea.submittedAt} className="bg-black/50 border border-purple-600/30">
      <CardHeader>
        <p>{idea.idea}</p>
        {idea.genre && <span className="text-xs text-gray-400">Genre: {idea.genre}</span>}
      </CardHeader>
      <CardContent className="flex justify-between mt-2 text-sm text-gray-300">
        <span>{idea.performerName}</span>
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => approveIdea(idea)}>
            Approve
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => discardIdea(idea)}>
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
              <p className="mb-2 font-medium">Selected Idea: {selectedIdea.idea}</p>
              <Button className="bg-blue-600 hover:bg-blue-700 mb-4" onClick={expandWithAI}>
                Expand with AI
              </Button>
              {aiFlow.map((scene, index) => (
                <Card key={index} className="bg-black/50 border border-blue-600/30">
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
            <p className="text-gray-400">Approve an idea to start AI expansion.</p>
          )}
        </div>

        {/* Developer Squads */}
        <div className="border rounded-xl p-4 space-y-3 bg-black/60 border-indigo-600/40">
          <h2 className="font-semibold text-xl mb-2">Developer Squads</h2>

          {/* Search */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Enter invite code..."
              className="flex-1 p-2 rounded bg-black/40 border border-gray-600 text-white"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
            <Button onClick={searchByInviteCode} className="bg-indigo-600 hover:bg-indigo-700">
              Search
            </Button>
          </div>

          {/* Display searched squad if exists, else show all */}
          {(searchedSquad ? [searchedSquad] : developerSquads).map((dev) => (
            <Card key={dev._id} className="bg-black/50 border border-indigo-600/30">
              <CardHeader>
                <CardTitle>{dev.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">Invite Code: {dev.inviteCode}</p>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 w-full my-3"
                  disabled={!selectedIdea}
                  onClick={() => sendToDeveloper(dev._id)}
                >
                  Share Idea / AI Flow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
