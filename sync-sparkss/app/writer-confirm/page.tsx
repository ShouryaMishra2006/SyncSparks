"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/app/context/AuthContext"
import { motion } from "framer-motion";

export default function WriterConfirmPage() {
  const [loading, setLoading] = useState(false);
  const [writerId, setWriterId] = useState<string | null>(null);
  const { user,isAuthenticated } = useAuth()
  if(user && user.writer?.writerId){
      window.location.href = `/dashboard/writer`;
  }
  const handleAssignWriterId = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/writer/assign-id", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        setWriterId(data.writerId);
        setTimeout(() => {
          window.location.href = `/dashboard/writer`;
        }, 2000);
      } else {
        alert(data.error || "Failed to assign writer ID");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white px-4">
      <motion.div
        className="absolute w-[700px] h-[700px] bg-blue-600/30 blur-3xl rounded-full opacity-20"
        animate={{
          x: [0, 100, -100, 0],
          y: [0, -100, 100, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      <Card className="w-full max-w-lg bg-white/10 border-white/20 text-white backdrop-blur-lg z-10">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            🎬 Writer / Director Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {!writerId ? (
            <>
              <p className="text-sm text-gray-300">
                Are you sure you want to contribute as a <b>Writer / Director</b>?
                You’ll be assigned a unique Writer ID to receive performer ideas.
              </p>

              <Button
                onClick={handleAssignWriterId}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "Assigning..." : "Assign me a Unique Writer ID"}
              </Button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-lg">
                Your Writer ID: <b>{writerId}</b>
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Redirecting you to your writer dashboard...
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
