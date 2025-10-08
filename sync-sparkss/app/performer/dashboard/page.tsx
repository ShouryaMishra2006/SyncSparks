"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

type Squad = {
  _id: string;
  name: string;
  description?: string;
  performers: string[];
};

export default function PerformerDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [availableSquads, setAvailableSquads] = useState<Squad[]>([]);
  const [mySquads, setMySquads] = useState<Squad[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSquad, setNewSquad] = useState({ name: "", description: "" });

  useEffect(() => {
    const fetchSquads = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/performer/squads", {
          credentials: "include",
        });
        const data: Squad[] = await res.json();
        if (res.ok && user?._id) {
          console.log(user._id);
          console.log(data);
          const my = data.filter((s) =>
            s.performers.some((p: any) => p._id === user._id)
          );

          const available = data.filter(
            (s) => !s.performers.some((p: any) => p._id === user._id)
          );

          setMySquads(my);
          console.log(my);

          setAvailableSquads(available);
          console.log(available);
        }
      } catch (err) {
        console.error("Error fetching squads:", err);
      }
    };
    if (isAuthenticated && user?._id) fetchSquads();
  }, [isAuthenticated, user?._id]);

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

  const handleCreateSquad = async () => {
    try {
      const res = await fetch(
        "http://localhost:4000/api/performer/createsquad",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(newSquad),
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Squad created successfully!");
        setAvailableSquads((prev) => [...prev, data]);
        setShowCreateForm(false);
        setNewSquad({ name: "", description: "" });
      } else {
        alert(data.message || "Failed to create squad");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleJoinSquad = async (squadId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/performer/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ squadId }),
      });
      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        const joinedSquad = availableSquads.find((s) => s._id === squadId);
        if (!joinedSquad) return;

        setMySquads((prev) => [...prev, joinedSquad]);
        setAvailableSquads((prev) => prev.filter((s) => s._id !== squadId));
      } else {
        alert(data.message || "Failed to join");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
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

      <div className="p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">🎭 SyncSparks</h1>
          <div className="text-right">
            <p className="text-lg">{user.name}</p>
            <p className="text-gray-400 text-sm">{user.nickname}</p>
          </div>
        </header>

        {/* Create Squad Button / Form */}
        <div className="flex justify-center mb-10">
          {!showCreateForm ? (
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setShowCreateForm(true)}
            >
              + Create Squad
            </Button>
          ) : (
            <div className="w-full max-w-md bg-black/70 p-6 rounded-xl shadow-lg border border-purple-600/40">
              <h2 className="text-xl font-semibold mb-4">Create New Squad</h2>
              <Input
                placeholder="Squad Name"
                className="mb-3"
                value={newSquad.name}
                onChange={(e) =>
                  setNewSquad({ ...newSquad, name: e.target.value })
                }
              />
              <Textarea
                placeholder="Squad Description"
                className="mb-3"
                value={newSquad.description}
                onChange={(e) =>
                  setNewSquad({ ...newSquad, description: e.target.value })
                }
              />
              <div className="flex gap-3">
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleCreateSquad}
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
            </div>
          )}
        </div>

        {/* Available Squads */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Available Squads</h2>
          {availableSquads.length === 0 ? (
            <p className="text-gray-400">No squads available to join.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableSquads.map((squad) => (
                <motion.div
                  key={squad._id}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-2xl shadow-lg overflow-hidden border border-purple-600/40 bg-black/50"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">{squad.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 mb-4">
                        {squad.description || "No description provided"}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Members: {squad.performers.length}
                      </p>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleJoinSquad(squad._id)}
                      >
                        Join Squad
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* My Squads */}
        <section>
          <h2 className="text-2xl font-bold mb-6">My Squads</h2>
          {mySquads.length === 0 ? (
            <p className="text-gray-400">You haven’t joined any squads yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {mySquads.map((squad) => (
                <motion.div
                  key={squad._id}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-2xl shadow-lg overflow-hidden border border-purple-600/40 bg-black/50"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">{squad.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 mb-4">
                        {squad.description || "No description provided"}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Members: {squad.performers.length}
                      </p>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() =>
                          router.push(`/performer/dashboard/${squad._id}`)
                        }
                      >
                        Go to Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
