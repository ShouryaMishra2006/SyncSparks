"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { useRouter } from "next/navigation";

import { layoutElements } from "../lib/dagreLayout";
import NodeWithNotes from "./NodeWithNotes";
import { Button } from "@/components/ui/button";
const { Download , Pencil} = require ("lucide-react");
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import EditableMindMap from "./EditableMindMap";


const nodeTypes = { customNode: NodeWithNotes };

type MindMapViewProps = {
  mapId: string;
  initialData: {
    nodes: Node[];
    edges: Edge[];
  };
};

export default function MindMapView({ mapId, initialData }: MindMapViewProps) {
  const router = useRouter();

  

  const nodesInitial = React.useMemo(() => 
  (initialData?.nodes || []).map((node) => ({
    ...node,
    data: {
      label: node.data?.label || "Node",
      notes: node.data?.notes || "",
      width: node.data?.width || 140,
      height: node.data?.height || 80,
      shape: node.data?.shape || "rounded",
      color: node.data?.color || "blue",
      ...node.data,
    },
  })),
  [initialData?.nodes]
);

const edgesInitial = React.useMemo(() => initialData?.edges || [], [initialData?.edges]);


  const [nodes, setNodes, onNodesChange] = useNodesState(nodesInitial);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesInitial);
  
  useEffect(() => {
    if (!initialData?.nodes?.length) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutElements(
      initialData.nodes,
      initialData.edges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodesInitial, edgesInitial, setNodes, setEdges]);

  const handleOpenEditor = () => {
    const params = new URLSearchParams({
      nodes: JSON.stringify(initialData.nodes),
      edges: JSON.stringify(initialData.edges),
    });

    router.push(`/editor/${mapId}?${params.toString()}`);
  };
  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // 📸 Export as image (JPG)
  const handleExportImage = async () => {
    const flow = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!flow) return;
    console.log(flow)
    const canvas = await html2canvas(flow);
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const link = document.createElement("a");
    link.download = `mindmap-${mapId}.jpg`;
    link.href = imgData;
    link.click();
  };

  // 📄 Export as PDF
  const handleExportPDF = async () => {
    const flow = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!flow) return;
    const canvas = await html2canvas(flow);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`mindmap-${mapId}.pdf`);
  };

  

  return (
    <div className="relative h-[70vh] w-full bg-gradient-to-br from-purple-950 via-black to-indigo-950 rounded-xl border border-purple-700 overflow-hidden">
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <Button variant="secondary" onClick={handleExportImage}>
          <Download className="w-4 h-4 mr-1" /> JPG
        </Button>
        <Button variant="secondary" onClick={handleExportPDF}>
          <Download className="w-4 h-4 mr-1" /> PDF
        </Button>
        <Button variant="default" onClick={handleOpenEditor}>
          <Pencil className="w-4 h-4 mr-1" /> Open Editor
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodeTypes={nodeTypes}
        className="rounded-xl"
      >
        <Background color="#999" gap={16} />
        <MiniMap nodeColor={() => "#6b21a8"} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
