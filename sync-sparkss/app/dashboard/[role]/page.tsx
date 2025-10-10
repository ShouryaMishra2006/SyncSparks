"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { useParams, useRouter } from "next/navigation";

type User = {
  _id: string;
  name: string;
  nickname?: string;
  email: string;
  isVerified: boolean;
  role: "performer" | "writer" | "developer";
  writer?: {
    writerId: string;
  };
};

export default function RoleDashboardPage() {
  const { user, loading, isAuthenticated, setUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const role = params.role as string;

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setUser(null); // Clear user from context
        router.push("/login"); // Redirect to login
      } else {
        alert("Failed to logout");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Server error during logout");
    }
  };

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

  // Define the cards
  const cards = [
    {
      title: "Performer Dashboard",
      image: "/images/performer.png",
      href: "/performer/dashboard",
      roles: ["performer"],
    },
    {
      title: "Writer Dashboard",
      image: "/images/writer.png",
      href: "/writer/dashboard",
      roles: ["writer"],
    },
    {
      title: "Developer Dashboard",
      image: "/images/developer.png",
      href: "/developer/dashboard",
      roles: ["developer"],
    },
    {
      title: "Collaboration Hub",
      image: "/images/collab.png",
      href: "/collab/hub",
      roles: ["performer", "writer", "developer"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white p-8">
      {/* Header with SyncSparks at top-left and Logout at top-right */}
      <header className="flex justify-between items-center mb-10">
        <span className="font-bold text-2xl">🎭 SyncSparks</span>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-red-600/20 hover:bg-red-600/40 border-red-600 text-red-300"
        >
          Logout
        </Button>
      </header>

      {/* User info */}
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-4xl font-bold mt-2">{user.name}</h1>
        <p className="text-lg text-gray-400">{user.nickname}</p>
        <span className="inline-block mt-2 px-4 py-1 rounded-full bg-purple-600 text-sm font-semibold">
          {role.toUpperCase()}
        </span>
        {/* Show writer ID if role is writer */}
        {role === "writer" && (
          <p className="mt-2 text-gray-300 font-mono">
            Writer ID:{" "}
            <span className="font-bold">{user.writer?.writerId}</span>
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((card, idx) => {
          const isUnlocked = card.roles.includes(role as any);

          return (
            <motion.div
              key={idx}
              whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
              className={`relative group rounded-2xl shadow-lg overflow-hidden border ${
                isUnlocked
                  ? "hover:shadow-purple-600/50"
                  : "opacity-40 pointer-events-none"
              }`}
            >
              <Image
                src={card.image}
                alt={card.title}
                width={400}
                height={350}
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <Card className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md rounded-t-none">
                <CardHeader>
                  <CardTitle className="text-xl text-center">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {isUnlocked ? (
                    <Link href={card.href}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        Open
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="bg-gray-600 text-white">
                      Locked
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
