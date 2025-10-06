"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import NodeWithNotes from "./NodeWithNotes";
import Sidebar from "./Sidebar";
import applyLayout from "../lib/dagreLayout";
import { MindMapNodeData } from "../types/mindmap";

const nodeTypes = { customNode: NodeWithNotes };

export default function MindMap() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // SAMPLE DATA
  const sampleNodes: Node[] = [
    { id: "1", type: "customNode", data: { label: "Root Node", notes: "Double-click to edit" }, position: { x: 0, y: 0 } },
    { id: "2", type: "customNode", data: { label: "Child Node 1", notes: "Edit me" }, position: { x: 100, y: 100 } },
    { id: "3", type: "customNode", data: { label: "Child Node 2", notes: "Edit me" }, position: { x: 300, y: 100 } },
  ];

  const sampleEdges: Edge[] = [
    { id: "e1-2", source: "1", target: "2", animated: true },
    { id: "e1-3", source: "1", target: "3", animated: true },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindMapNodeData>>(sampleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(sampleEdges);

  // Layout nodes on mount
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(sampleNodes, sampleEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, []);

  // Handle interactive edge creation
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  // Drag-and-drop nodes from Sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const id = `${+new Date()}`;
      const newNode: Node = {
        id,
        type,
        position,
        data: {
          label: "New Node",
          notes: "Edit me",
          onChange: (newData: any) =>
            setNodes((nds) =>
              nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...newData } } : n))
            ),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Flow Canvas */}
      <div className="flex-1 p-4" ref={reactFlowWrapper}>
        <div className="w-full h-[90vh] bg-white rounded-xl shadow-lg border border-gray-200">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <MiniMap nodeColor="#4f46e5" nodeStrokeWidth={2} />
            <Controls />
            <Background gap={20} color="#f0f0f0" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
