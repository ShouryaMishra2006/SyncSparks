"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";

interface RequestItem {
  _id: string;
  writerId: string;
  writerName: string;
  idea: string;
  submittedAt: string;
  markAsDone: boolean;
  developerId: string;
}

interface DeveloperSquadDetails {
  _id: string;
  name: string;
  description: string;
  inviteCode: string;
  requests: RequestItem[];
}

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const params = useParams();
  const squadId = params?.squadId as string;

  const [squad, setSquad] = useState<DeveloperSquadDetails | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [simulation, setSimulation] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchSquadDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/developer/squad/${squadId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setSquad(data.squad);
    } catch (err) {
      console.error("Failed to fetch squad details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (squadId) fetchSquadDetails();
  }, [squadId]);

  const markRequestDone = async (requestId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/developer/mark-request-done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ squadId, requestId }),
      });
      const data = await res.json();
      if (data.success) fetchSquadDetails();
    } catch (err) {
      console.error("Failed to mark request as done:", err);
    }
  };

  const runSimulation = (request: RequestItem) => {
    setSelectedRequest(request);
    setSimulation(`Simulating: ${request.idea}`);
  };

  const pushWork = async () => {
    if (!selectedRequest) return;
    try {
      await fetch("http://localhost:4000/api/developer/push-work", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: selectedRequest, simulation }),
      });
      alert("Work pushed successfully!");
      setSelectedRequest(null);
      setSimulation("");
      fetchSquadDetails();
    } catch (err) {
      console.error(err);
      alert("Failed to push work");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="relative min-h-screen text-white p-8 space-y-8">
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

      {/* Squad Header */}
      {squad && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-purple-600/40 pb-4">
          <div>
            <h2 className="text-3xl font-bold">{squad.name}</h2>
            <p className="text-gray-300">{squad.description}</p>
          </div>
          <p className="text-sm text-gray-400 mt-2 md:mt-0">
            Invite Code: <span className="text-purple-400">{squad.inviteCode}</span>
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Writer Requests Section */}
        <div className="border rounded-xl p-4 space-y-4 bg-black/60 border-purple-600/40 max-h-[70vh] overflow-y-auto">
          <h2 className="font-semibold text-2xl mb-2 border-b border-purple-600/30 pb-2">Writer Requests</h2>
          {squad?.requests.length === 0 && <p className="text-gray-400">No pending requests.</p>}
          {squad?.requests.map((req) => (
            <Card
              key={req._id}
              className="bg-black/50 border border-purple-600/30 hover:scale-105 transition-transform duration-200"
            >
              <CardHeader>
                <CardTitle>{req.writerName}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-gray-300">{req.idea}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    onClick={() => runSimulation(req)}
                  >
                    Work on it
                  </Button>
                  {!req.markAsDone && (
                    <Button
                      className="bg-red-600 hover:bg-red-700 flex-1"
                      onClick={() => markRequestDone(req._id)}
                    >
                      Mark as Done
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Simulation Section */}
        <div className="border rounded-xl p-4 space-y-4 bg-black/60 border-blue-600/40 max-h-[70vh] overflow-y-auto">
          <h2 className="font-semibold text-2xl mb-2 border-b border-blue-600/30 pb-2">Live Simulation</h2>
          {selectedRequest ? (
            <>
              <p className="mb-2 font-medium">Working on: {selectedRequest.idea}</p>
              <Textarea className="bg-black/40 text-white mb-2 h-48" value={simulation} readOnly />
              <Button className="bg-blue-600 hover:bg-blue-700 w-full" onClick={pushWork}>
                Push Work Done
              </Button>
            </>
          ) : (
            <p className="text-gray-400">Select a request from the left panel to start simulation.</p>
          )}
        </div>
      </div>
    </div>
  );
}
