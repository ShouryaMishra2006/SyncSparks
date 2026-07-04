"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation"; 
import StaticBackgroundBubbles from "@/components/StaticBackgroundBubbles";

interface DeveloperSquad {
  _id: string;
  name: string;
  description: string;
  inviteCode: string;
}

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const router = useRouter();
  const [createData, setCreateData] = useState({
    name: "",
    description: "",
    password: "",
  });

  const [joinData, setJoinData] = useState({
    password: "",
    inviteCode: "",
  });

  const [squads, setSquads] = useState<DeveloperSquad[]>([]);
  useEffect(() => {
    if (user?.developer) {
      console.log(user.developer);
    }
    if (user?.developer?.squadsJoined) {
      setSquads(user.developer.squadsJoined);
    }
  }, [user?.developer?.squadsJoined]);
  const handleCreateSquad = async () => {
    try {
      const res = await fetch(
        "http://localhost:4000/api/developer/squad/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(createData),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create squad");

      alert("Squad created successfully!");
      setCreateData({ name: "", description: "", password: "" });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Join Squad
  const handleJoinSquad = async () => {
    try {
      const res = await fetch(
        "http://localhost:4000/api/developer/squad/join",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(joinData),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join squad");

      alert("Joined squad successfully!");
      setJoinData({ password: "", inviteCode: "" });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden p-8 space-y-10">
      <StaticBackgroundBubbles />

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold">👨‍💻 Developer Dashboard</h1>
        <div className="text-right">
          <p className="text-lg">{user?.name}</p>
          <p className="text-sm text-gray-400">Role: Developer</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Section: Create / Join */}
        <div className="border rounded-xl p-4 space-y-4 bg-black/60 border-green-600/40">
          <h2 className="font-semibold text-xl mb-2">Squad Management</h2>

          {/* Create Squad */}
          <div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "Hide Create Form" : "➕ Create Squad"}
            </Button>

            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 space-y-3"
              >
                <Input
                  placeholder="Squad Name"
                  value={createData.name}
                  onChange={(e) =>
                    setCreateData({ ...createData, name: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Description"
                  value={createData.description}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      description: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={createData.password}
                  onChange={(e) =>
                    setCreateData({ ...createData, password: e.target.value })
                  }
                />
                <Button
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                  onClick={handleCreateSquad}
                >
                  Create Squad
                </Button>
              </motion.div>
            )}
          </div>

          {/* Join Squad */}
          <div>
            <Button
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              onClick={() => setShowJoinForm(!showJoinForm)}
            >
              {showJoinForm ? "Hide Join Form" : "🔑 Join Squad"}
            </Button>

            {showJoinForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 space-y-3"
              >
                <Input
                  placeholder="Squad Password"
                  type="password"
                  value={joinData.password}
                  onChange={(e) =>
                    setJoinData({ ...joinData, password: e.target.value })
                  }
                />
                <Input
                  placeholder="Invite Code"
                  value={joinData.inviteCode}
                  onChange={(e) =>
                    setJoinData({ ...joinData, inviteCode: e.target.value })
                  }
                />
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 w-full"
                  onClick={handleJoinSquad}
                >
                  Join Squad
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Section: Joined Squads */}
        <div className="md:col-span-2 border rounded-xl p-4 bg-black/60 border-purple-600/40">
          <h2 className="font-semibold text-xl mb-4">Joined Squads</h2>
          {squads.length === 0 ? (
            <p className="text-gray-400">You haven’t joined any squads yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {squads.map((squad, idx) => (
                <Card
                  key={idx}
                  className="bg-black/50 border border-purple-600/30"
                >
                  <CardHeader>
                    <CardTitle>{squad.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-2">{squad.description}</p>
                    <p className="text-sm text-gray-400">
                      Invite Code:{" "}
                      <span className="text-purple-400">
                        {squad.inviteCode}
                      </span>
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 w-full my-3"
                      onClick={() =>
                        router.push(`/developer/dashboard/${squad._id}`)
                      }
                    >
                      Contribute
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
