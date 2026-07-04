"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/context/AuthContext";
import Prompt2DWorkspace from "@/components/Prompt2DWorkspace";

type RequestItem = {
  _id: string;
  writerId: string;
  writerName: string;
  idea: string;
  submittedAt: string;
  markAsDone: boolean;
  deployedPreviewUrl?: string;
  deployedAt?: string;
  previewId?: string;
};

type SquadInfo = {
  _id: string;
  name: string;
  description?: string;
  developers?: { name: string; email?: string }[];
  requests?: RequestItem[];
};

export default function DeveloperDashboardPage() {
  const params = useParams();
  const squadId = params?.squadId!;
  const {user} = useAuth()
  const [squad, setSquad] = useState<SquadInfo | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [latest, setLatest] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSquad = async () => {
    if (!squadId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/developer/squad/${squadId}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.success && data.squad) {
        const squadData = data.squad;
        setSquad(squadData);

        const reqs = squadData.requests || [];
        setRequests(reqs);

        const done = reqs
          .filter((r: any) => r.deployedPreviewUrl)
          .sort(
            (a: any, b: any) =>
              new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
          );
        setLatest(done);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSquad();
  }, [squadId]);

  return (
    <div className="relative overflow-hidden min-h-screen text-white">
      {/*  Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-indigo-900 animate-gradient-slow opacity-60"></div>

      <div className="relative z-10 p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Developer Squad Dashboard</h1>
          <span className="text-sm md:text-base text-gray-300 bg-black/30 px-3 py-1 rounded-full border border-purple-600/40">
            {user?.name}
          </span>
        </div>

        {/* Squad Info Section */}
        {squad ? (
          <div className="mb-8 bg-black/50 p-4 rounded-2xl border border-purple-600/30 shadow-lg shadow-purple-900/20">
            <h2 className="text-2xl font-semibold mb-2">{squad.name}</h2>
            {squad.description && (
              <p className="text-gray-400 mb-3">{squad.description}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-400 mb-8">Fetching squad info...</p>
        )}

        {/* Two-Section Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requests Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active Requests</h2>
            {loading && <p>Loading requests...</p>}
            {requests.length === 0 && !loading && (
              <p className="text-gray-400">No active requests available.</p>
            )}
            {requests.map((r) => (
              <Card key={r._id} className="bg-black/60 border-purple-600/30">
                <CardHeader>
                  <CardTitle>{r.writerName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-2">{r.idea}</p>
                  <Link
                    href={`/developer/dashboard/${squadId}/request/${r._id}/editor`}
                  >
                    <Button className="bg-green-600 hover:bg-green-700 transition">
                      Open Editor
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Latest Work Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Latest Work (Deployed)</h2>
            {latest.length === 0 && (
              <p className="text-gray-400">No deployed work yet.</p>
            )}
            {latest.map((r) => (
              <Card key={r._id} className="bg-black/60 border-indigo-600/30">
                <CardHeader>
                  <CardTitle>{r.writerName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-2">{r.idea}</p>
                  {r.previewId ? (
                    <Link
                      href={`/developer/preview/${r.previewId}`}
                      className="text-indigo-400 block hover:underline"
                    >
                      Open Preview & Code
                    </Link>
                  ) : r.deployedPreviewUrl ? (
                    <a
                      className="text-indigo-400 block hover:underline"
                      href={r.deployedPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Preview
                    </a>
                  ) : null}

                  {r.deployedAt && (
                    <p className="text-sm text-gray-400 mt-1">
                      Deployed: {new Date(r.deployedAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Prompt2DWorkspace />
      </div>
    </div>
  );
}
