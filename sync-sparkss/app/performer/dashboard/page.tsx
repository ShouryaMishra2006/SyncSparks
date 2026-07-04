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
import StaticBackgroundBubbles from "@/components/StaticBackgroundBubbles";

type Squad = {
  _id: string;
  name: string;
  description?: string;
  performers: string[];
  invitationCode?: {
    text: string;
  };
};

export default function PerformerDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [availableSquads, setAvailableSquads] = useState<Squad[]>([]);
  const [mySquads, setMySquads] = useState<Squad[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSquad, setNewSquad] = useState({ name: "", description: "" });
  const [invitationCodes, setInvitationCodes] = useState<
    Record<string, string>
  >({});
  const [joinByCode, setJoinByCode] = useState("");

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
  //returns: a list of squads user can join (update in api: only public squads)
  const handleCreateSquad = async (isPublic: boolean) => {
    try {
      const res = await fetch(
        "http://localhost:4000/api/performer/createsquad",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...newSquad, public: isPublic }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Squad created successfully!");
        // Add to mySquads since the creator automatically joins
        setMySquads((prev) => [...prev, data]);
        // If it's a public squad (no invitation code), also add to available squads
        if (isPublic && !data.invitationCode) {
          setAvailableSquads((prev) => [...prev, data]);
        }
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

  const handleJoinSquad = async (squadId: string, invitationCode?: string) => {
    try {
      const body: { squadId: string; invitationCode?: string } = { squadId };
      if (invitationCode) {
        body.invitationCode = invitationCode;
      }

      const res = await fetch(`http://localhost:4000/api/performer/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        const joinedSquad = availableSquads.find((s) => s._id === squadId);
        if (!joinedSquad) return;

        setMySquads((prev) => [...prev, joinedSquad]);
        setAvailableSquads((prev) => prev.filter((s) => s._id !== squadId));
        // Clear the invitation code input for this squad
        setInvitationCodes((prev) => {
          const newCodes = { ...prev };
          delete newCodes[squadId];
          return newCodes;
        });
      } else {
        alert(data.message || "Failed to join");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleJoinByCode = async () => {
    if (!joinByCode.trim()) {
      alert("Please enter an invitation code");
      return;
    }

    try {
      const joinRes = await fetch(`http://localhost:4000/api/performer/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invitationCode: joinByCode.trim() }),
      });

      const joinData = await joinRes.json();

      if (joinRes.ok) {
        alert(joinData.message);
        // Refetch squads to get updated list
        const refreshRes = await fetch(
          "http://localhost:4000/api/performer/squads",
          {
            credentials: "include",
          }
        );
        const refreshedSquads: Squad[] = await refreshRes.json();

        if (refreshRes.ok && user?._id) {
          const my = refreshedSquads.filter((s) =>
            s.performers.some((p: any) => p._id === user._id)
          );
          const available = refreshedSquads.filter(
            (s) => !s.performers.some((p: any) => p._id === user._id)
          );
          setMySquads(my);
          setAvailableSquads(available);
        }

        setJoinByCode("");
      } else {
        alert(joinData.message || "Failed to join squad");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <StaticBackgroundBubbles />

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
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleCreateSquad(true)}
                >
                  Create Public
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleCreateSquad(false)}
                >
                  Create Private
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

        {/* Join Squad by Invitation Code */}
        <div className="flex justify-center mb-10">
          <div className="w-full max-w-md bg-black/70 p-6 rounded-xl shadow-lg border border-green-600/40">
            <h2 className="text-xl font-semibold mb-4">Join Private Squad</h2>
            <Input
              placeholder="Enter Invitation Code"
              className="mb-3"
              value={joinByCode}
              onChange={(e) => setJoinByCode(e.target.value)}
            />
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleJoinByCode}
            >
              Join Squad
            </Button>
          </div>
        </div>

        {/* Available Squads */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Available Squads</h2>
          {availableSquads.filter((squad) => !squad.invitationCode).length ===
          0 ? (
            <p className="text-gray-400">No squads available to join.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableSquads
                .filter((squad) => !squad.invitationCode)
                .map((squad) => (
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
                            handleJoinSquad(
                              squad._id,
                              invitationCodes[squad._id]
                            )
                          }
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

                      {squad.invitationCode && (
                        <div className="mb-3 p-2 bg-purple-900/30 rounded border border-purple-600/30">
                          <p className="text-xs text-gray-400 mb-1">
                            🔒 Private Squad - Invitation Code:
                          </p>
                          <p className="text-sm font-mono text-purple-300 font-bold">
                            {squad.invitationCode.text}
                          </p>
                        </div>
                      )}

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
