"use client"; // needed because it uses client-side dynamic import / ReactFlow

import dynamic from "next/dynamic";

const MindMap = dynamic(() => import("../../components/MindMap"), { ssr: false });
console.log("Mindmap:", MindMap);

export default function MindMapPage() {
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Mind Map View</h1>
      <MindMap />
    </div>
  );
}
