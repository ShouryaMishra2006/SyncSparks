"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import StaticBackgroundBubbles from "@/components/StaticBackgroundBubbles";

import "leaflet/dist/leaflet.css";
const MindMapView = dynamic(() => import("@/components/MindMap"), {
  ssr: false,
});
import { Mic, Search } from "lucide-react";
import { arrayBuffer } from "stream/consumers";

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
  nickname?: string;
  writer?: {
    writerId: string;
    ideaInbox: any[];
    _id: string;
  };
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
  const [map, setMap] = useState<L.Map | null>(null);
  const [squad, setSquad] = useState<Squad | null>(null);
  const [newIdea, setNewIdea] = useState("");
  const [writers, setWriters] = useState<Writer[]>([]);
  const [listening, setListening] = useState(false);
  const [leaflet, setLeaflet] = useState<any>(null);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showinputbutton, setshowinputbutton] = useState(false);
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [query, setQuery] = useState("");
  const [writerid, setwriterid] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);

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
  useEffect(() => {
    if (!showinputbutton) return;
    if (map) return;

    (async () => {
      const L = (await import("leaflet")).default;
      setLeaflet(L);
      const container = document.getElementById("map");
      if (!container) return;

      const newMap = L.map(container).setView([20.5937, 78.9629], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(newMap);

      setMap(newMap);

      setTimeout(() => newMap.invalidateSize(), 300);
    })();
  }, [showinputbutton]);

  useEffect(() => {
    const fetchSquad = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/performer/squads/${squadId}`,
          { credentials: "include" },
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
  useEffect(() => {
    const fetchWriters = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/writer/fetch", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.length == 0) {
          let writers = [];
          writers = [
            {
              name: "Shourya Mishra",
              writer: {
                writerId: "WRT-C30CBA9D",
                location: {
                  coordinates: [77.71232115218265, 12.964011951950484],
                },
              },
            },
          ];
        }
        if (res.ok) setWriters(data);
        console.log("something happening");
        console.log("writers fetched: ", data);
      } catch (err) {
        console.error("Error fetching writers:", err);
      }
    };
    fetchWriters();
    console.log("fetching...");
  }, []);

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!isAuthenticated || !user)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white">
        <p className="mb-4">You are not logged in.</p>
      </div>
    );
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
        },
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
        },
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
        },
      );
      const data = await res.json();
      if (res.ok) {
        console.log(`summary: ${data.summary}`);
        setAiResult(data.summary);
        setShowMindMap(false);
      } else {
        alert(data.message || "Failed to summarize");
      }
    } catch (err) {
      console.error("Error summarizing:", err);
    }
  };

  const handleMindMap = async () => {
    if (!squad) return;
    const countStr = prompt(
      "How many last ideas do you want to generate the mind map from?",
    );
    if (!countStr) return;

    const count = parseInt(countStr);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid number");
      return;
    }

    const lastIdeas = squad.ideas.slice(-count).map((idea) => idea.text);

    try {
      console.log(squad);
      console.log("squad id:", squad._id);
      const res = await fetch(
        `http://localhost:4000/api/performer/squads/${squad._id}/mindmap`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ideas: lastIdeas }),
        },
      );

      const data = await res.json();
      console.log("data:", data);
      if (res.ok && data?.nodes && data?.edges) {
        console.log("Mind map data:", data);
        type BackendNode = {
          id: string | number;
          text: string;
          explanation?: string;
          color?: string;
        };

        type BackendEdge = {
          source: string | number;
          target: string | number;
        };
        const nodesWithPositions = (data.nodes as BackendNode[]).map(
          (node: BackendNode, index: number) => ({
            id: String(node.id),
            position: { x: index * 150, y: index * 80 },
            data: {
              label: node.text || `Node ${index}`,
              notes: node.explanation || "",
              color: node.color || "blue",
            },
            type: "customNode",
          }),
        );

        const edgesFormatted = (data.edges as BackendEdge[]).map(
          (edge: BackendEdge, index: number) => ({
            id: `edge-${index}`,
            source: String(edge.source),
            target: String(edge.target),
          }),
        );

        setMindMapData({
          nodes: nodesWithPositions,
          edges: edgesFormatted,
        });

        setShowMindMap(true);
      } else {
        alert(data.message || "Failed to generate mind map");
      }
    } catch (err) {
      console.error("Error generating mind map:", err);
    }
  };

  const handleExpand = async () => {};
  const handleSearchwriter = async () => {
    try {
      if (!writerid) {
        alert("Please enter a Writer ID to search.");
        return;
      }

      const params = new URLSearchParams();
      if (writerid) params.append("writerid", writerid);

      const res = await fetch(
        `http://localhost:4000/api/performer/squads/search-writer?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        console.error("Error fetching writer:", data.message);
        alert(data.message || "Writer not found");
        return;
      }
      const w = data.writer;
      const warr = [];
      warr.push(w);
      setWriters(warr);
    } catch (error) {
      console.error("Search error:", error);
      alert("Something went wrong while searching for the writer.");
    }
  };

  const handleShare = (writerId: string) => {
    if (!aiResult) {
      alert("No AI result to share!");
      return;
    }

    const payload = {
      writerId: writerId,
      aiResult: {
        title: aiResult.title,
        text: aiResult.text,
        bullets: aiResult.bullets,
      },
    };

    fetch("http://localhost:4000/api/writer/ai/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log("performer shared", data);
          alert(`AI result shared successfully`);
        } else {
          alert(`Failed to share AI result: ${data.message || "Error"}`);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Error sharing AI result.");
      });
  };
  const handleFetchWriters = async () => {
    const radius = Number(
      (document.getElementById("radiusInput") as HTMLInputElement).value,
    );
    if (!radius) {
      alert("Please enter radius");
      return;
    }
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        if (!leaflet || !map) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const response = await fetch(
          `http://localhost:4000/api/writer/nearby?lat=${lat}&lng=${lng}&r=${radius}`,
          {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          },
        );
        const writers = await response.json();
        console.log("writers fetched:", writers);

        map.eachLayer((layer: any) => {
          if (layer.options?.pane === "markerPane") {
            map.removeLayer(layer);
          }
        });
        writers.forEach((w: any) => {
          const marker = leaflet.marker(
            [
              w.writer.location.coordinates[1],
              w.writer.location.coordinates[0],
            ],
            { title: w.writer.writerId },
          );

          console.log(marker);

          marker.addTo(map);

          console.log(map.hasLayer(marker));
          console.log(w.writer.location.coordinates[1]);
          console.log(w.writer.location.coordinates[0]);
          console.log(w.writer.writerId);
          leaflet
            .circle(
              [
                w.writer.location.coordinates[1],
                w.writer.location.coordinates[0],
              ],
              { title: w.writer.writerId },
              {
                radius: 50,
                color: "red",
                fillColor: "red",
                fillOpacity: 1,
              },
            )
            .addTo(map);
          leaflet
            .marker(
              [
                w.writer.location.coordinates[1],
                w.writer.location.coordinates[0],
              ],
            )
            .addTo(map)
            .bindPopup(w.writer.writerId);
        });
        map.setView([lat, lng], 10);
        console.log(lat);
        leaflet
          .marker([lat, lng], { title: "You" })
          .addTo(map)
          .bindPopup("Your Location");
      });
    } catch (e) {
      console.log(e);
    }
  };
  const handleDeleteIdea = async (ideaId: string) => {
    if (!squad) return;

    const confirmDelete = confirm("Are you sure you want to delete this idea?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `http://localhost:4000/api/performer/squads/${squad._id}/idea/${ideaId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await res.json();
      if (res.ok) {
        setIdeas((prev) => prev.filter((idea) => idea._id !== ideaId));
        setSquad({
          ...squad,
          ideas: squad.ideas.filter((idea) => idea._id !== ideaId),
        });
        alert("Idea deleted successfully");
      } else {
        alert(data.message || "Failed to delete idea");
      }
    } catch (err) {
      console.error("Error deleting idea:", err);
      alert("Error deleting idea");
    }
  };

  return (
    <div className="min-h-screen text-white p-6 relative">
      <StaticBackgroundBubbles />

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
                  <Button
                    onClick={() => handleDeleteIdea(idea._id)}
                    className="bg-red-600 hover:bg-red-700 text-xs h-6 px-2"
                  >
                    Delete
                  </Button>
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
            {/* <Button
              onClick={handleExpand}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Expand
            </Button> */}
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

            {showMindMap && mindMapData && squad && (
              <motion.div
                className="rounded-xl border border-indigo-600/40 overflow-hidden mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <MindMapView
                  mapId={squad._id}
                  initialData={{
                    nodes: mindMapData?.nodes || [],
                    edges: mindMapData?.edges || [],
                  }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
        {/* Section 3: Writers */}
        <motion.div
          className="bg-black/50 rounded-xl p-4 border border-purple-600/40 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-row justify-between my-2">
            <h3 className="text-xl font-semibold mb-3"> Writers</h3>
            <Button
              onClick={() => setshowinputbutton(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center"
            >
              <MapPin />
              See Nearby Writers
            </Button>
            {showinputbutton && (
              <div className="flex flex-col gap-3 items-center">
                <input
                  id="radiusInput"
                  type="number"
                  min="1"
                  placeholder="Radius (km)"
                  className="px-3 py-2 w-40 border rounded-lg shadow"
                />

                <button
                  id="findWritersBtn"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                  onClick={handleFetchWriters}
                >
                  Find Writers
                </button>
                <div
                  id="map"
                  className="w-full h-80 rounded-lg border border-purple-600"
                ></div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Search writer (Enter writer's id)"
              value={writerid}
              onChange={(e) => setwriterid(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSearchwriter}
              className="bg-purple-600 hover:bg-purple-700 flex items-center"
            >
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
          </div>
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
                  <p className="text-sm text-yellow-400 font-mono">
                    ID: {writer.writer?.writerId}
                  </p>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleShare(writer.writer?.writerId!)}
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
