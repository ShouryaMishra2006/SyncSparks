"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import StaticBackgroundBubbles from "@/components/StaticBackgroundBubbles";

export default function CollaborationHub() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");

  if (loading) return <div className="text-white p-10">Loading...</div>;

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white">
        <p className="mb-4">You are not logged in.</p>
        <Link href="/login">
          <Button className="bg-purple-600">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      alert("Please enter a session name");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/collab/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: sessionName }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Session created successfully!");
        // Navigate to the canvas page
        router.push(`/collab/canvas/${data._id}`);
      } else {
        alert(data.message || "Failed to create session");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleJoinSession = async () => {
    if (!invitationCode.trim()) {
      alert("Please enter an invitation code");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/collab/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invitationCode: invitationCode.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        // Navigate to the canvas page
        router.push(`/collab/canvas/${data.session._id}`);
      } else {
        alert(data.message || "Failed to join session");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-gradient-to-b from-gray-900 via-black to-gray-950">
      <StaticBackgroundBubbles />

      <div className="p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">🎨 Collaboration Hub</h1>
          <div className="text-right">
            <p className="text-lg">{user.name}</p>
            <p className="text-gray-400 text-sm">{user.nickname}</p>
          </div>
        </header>

        {/* Main Options */}
        <div className="flex flex-col items-center justify-center space-y-6 mt-20">
          {!showCreateForm && !showJoinForm && (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-full max-w-md"
              >
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-xl py-8"
                  onClick={() => setShowCreateForm(true)}
                >
                  + Create New Session
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-full max-w-md"
              >
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xl py-8"
                  onClick={() => setShowJoinForm(true)}
                >
                  🔗 Join with Invitation Code
                </Button>
              </motion.div>
            </>
          )}

          {/* Create Session Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-black/70 p-6 rounded-xl shadow-lg border border-green-600/40"
            >
              <h2 className="text-xl font-semibold mb-4">
                Create New Collaboration Session
              </h2>
              <Input
                placeholder="Session Name"
                className="mb-3"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCreateSession}
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {/* Join Session Form */}
          {showJoinForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-black/70 p-6 rounded-xl shadow-lg border border-blue-600/40"
            >
              <h2 className="text-xl font-semibold mb-4">
                Join Collaboration Session
              </h2>
              <Textarea
                placeholder="Enter Invitation Code"
                className="mb-3"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleJoinSession}
                >
                  Join
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowJoinForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
