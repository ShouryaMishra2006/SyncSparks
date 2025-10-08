"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import NodeWithNotes from "./NodeWithNotes";
import { layoutElements } from "../lib/dagreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const { v4: uuidv4 } = require("uuid");
import { MindNodeData } from "@/types/mindmap";


const nodeTypes = { customNode: NodeWithNotes };

type EditableMindMapProps = {
  initialNodes: Node[];
  initialEdges: Edge[];
  onCloseEditor: () => void;
};

export default function EditableMindMap({
  initialNodes,
  initialEdges,
  onCloseEditor,
}: EditableMindMapProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [newNodeText, setNewNodeText] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);

  const [labelInput, setLabelInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [widthInput, setWidthInput] = useState(140);
  const [heightInput, setHeightInput] = useState(80);
  const [shapeInput, setShapeInput] = useState<"rectangle" | "rounded" | "circle">("rounded");
  const [colorInput, setColorInput] = useState<"blue" | "green" | "purple" | "orange">("blue");

  const [edgeFromNode, setEdgeFromNode] = useState<string | null>(null);
  const [edgeToNode, setEdgeToNode] = useState<string | null>(null);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.min(Math.max(150, e.clientX), 500);
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutElements(nodes, edges);
    setNodes(layoutedNodes);
    console.log("nodes:",nodes)
    setEdges(layoutedEdges);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  useEffect(() => {
    if (selectedNode) {
      setLabelInput(selectedNode.data.label);
      setNotesInput(selectedNode.data.notes || "");
      setWidthInput(selectedNode.data.width || 140);
      setHeightInput(selectedNode.data.height || 80);
      setShapeInput(selectedNode.data.shape || "rounded");
      setColorInput(selectedNode.data.color || "blue");
      setEdgeFromNode(selectedNode.id);
      setEdgeToNode(null);
    }
  }, [selectedNode]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const handleAddNode = () => {
    if (!newNodeText.trim()) return alert("Please enter a label for the new node!");
    const id = `node-${uuidv4()}`;
    const newNode: Node = {
      id,
      type: "customNode",
      position: { x: 200, y: 200 },
      data: { label: newNodeText, notes: "", width: 140, height: 80, shape: "rounded", color: "blue" },
    };
    setNodes((nds) => [...nds, newNode]);
    setNewNodeText("");
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  const handleUpdateSelectedNode = (overrideData?: Partial<MindNodeData>) => {
    if (!selectedNode) return;
  
    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        label: labelInput,
        notes: notesInput,
        width: widthInput,
        height: heightInput,
        shape: shapeInput,
        color: overrideData?.color ?? colorInput,      },
    };
  
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
    );
  
    setSelectedNode(updatedNode);
  };
  

  const handleAddEdge = () => {
    if (!edgeFromNode || !edgeToNode) return alert("Select both From and To nodes");
    if (edgeFromNode === edgeToNode) return alert("Cannot connect a node to itself");
    if (edges.some((e) => e.source === edgeFromNode && e.target === edgeToNode)) return alert("Edge already exists");

    const newEdge: Edge = { id: `edge-${edgeFromNode}-${edgeToNode}-${Date.now()}`, source: edgeFromNode, target: edgeToNode, animated: true };
    setEdges((eds) => addEdge(newEdge, eds));
    setEdgeToNode(null);
  };

  const handleRemoveEdge = (edgeId: string) => setEdges((eds) => eds.filter((e) => e.id !== edgeId));

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white overflow-y-auto">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="flex flex-col bg-gray-800 border-r border-gray-700 p-4 relative shadow-lg overflow-y-auto"
        style={{ width: sidebarWidth, minWidth: 240, maxWidth: 400 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">🧭 Mind Map Tools</h2>
        </div>

        {/* New Node */}
        <div className="space-y-2 mb-6">
          <Input
            placeholder="New node label..."
            value={newNodeText}
            onChange={(e) => setNewNodeText(e.target.value)}
            className="bg-gray-700 text-white border-gray-600"
          />
          <Button onClick={handleAddNode} className="w-full">
            Add Node
          </Button>
        </div>

        {/* Edge Management */}
        <div className="space-y-3 mb-6 flex-shrink-0">
          <h3 className="font-semibold text-white border-b border-gray-600 pb-1">
            Edge Management
          </h3>

          <div className="space-y-2">
            <Label className="text-gray-300">From Node</Label>
            <Select value={edgeFromNode || ""} onValueChange={setEdgeFromNode}>
              <SelectTrigger className="w-full h-9 px-3 bg-gray-700 text-white border border-gray-600 rounded">
                <SelectValue placeholder="Select source node" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white rounded-md border border-gray-700 shadow-lg">
                {nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.data.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="text-gray-300 mt-2">To Node</Label>
            <Select value={edgeToNode || ""} onValueChange={setEdgeToNode}>
              <SelectTrigger className="w-full h-9 px-3 bg-gray-700 text-white border border-gray-600 rounded">
                <SelectValue placeholder="Select target node" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white rounded-md border border-gray-700 shadow-lg">
                {nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.data.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleAddEdge} className="w-full mt-2">
              Add Edge
            </Button>
          </div>

          {/* Remove edges */}
          <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
            <Label className="text-gray-300">Remove edges</Label>
            {edges
              .filter(
                (e) => e.source === selectedNode?.id || e.target === selectedNode?.id
              )
              .map((e) => {
                const otherNodeId = e.source === selectedNode?.id ? e.target : e.source;
                const otherNode = nodes.find((n) => n.id === otherNodeId);
                return (
                  <div
                    key={e.id}
                    className="flex justify-between items-center text-sm bg-gray-700 p-2 rounded"
                  >
                    <span>{otherNode?.data.label || "Unknown"}</span>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveEdge(e.id)}
                    >
                      ✕
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Selected Node Editor */}
        {selectedNode && (
          <div className="flex flex-col flex-1 max-h-50px mt-4">
            <h3 className="font-semibold text-white border-b border-gray-600 pb-1">
              Selected Node
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 mt-2">
              <Label className="text-gray-300">Label</Label>
              <Input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onBlur={() => handleUpdateSelectedNode()} // wrap in arrow
                className="bg-gray-700 text-white border-gray-600"
              />

              <Label className="text-gray-300">Notes</Label>
              <Textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                onBlur={() => handleUpdateSelectedNode()} // wrap in arrow
                rows={3}
                className="bg-gray-700 text-white border-gray-600"
              />

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-gray-300">Width</Label>
                  <Input
                    type="number"
                    value={widthInput}
                    onChange={(e) => setWidthInput(Number(e.target.value))}
                    onBlur={() => handleUpdateSelectedNode()} // wrap in arrow
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-gray-300">Height</Label>
                  <Input
                    type="number"
                    value={heightInput}
                    onChange={(e) => setHeightInput(Number(e.target.value))}
                    onBlur={() => handleUpdateSelectedNode()} // wrap in arrow
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>
              </div>

              {/* <Label className="text-gray-300">Shape</Label>
              <Select
                value={shapeInput}
                onValueChange={(val: "rectangle" | "rounded" | "circle") => {
                  setShapeInput(val);
                  handleUpdateSelectedNode();
                }}
              >
                <SelectTrigger className="w-full h-9 px-3 bg-gray-700 text-white border border-gray-600 rounded">
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 text-white">
                  <SelectItem value="rectangle">Rectangle</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                </SelectContent>
              </Select> */}

              <Label className="text-gray-300">Color</Label>
              <div className="flex gap-2">
                {(["blue", "green", "purple", "orange"] as const).map((clr) => (
                  <Button
                    key={clr}
                    className={`w-6 h-6 p-0 rounded-full border-2 ${
                      clr === colorInput ? "border-white scale-110" : "border-gray-500"
                    }`}
                    style={{
                      backgroundColor:
                        clr === "blue"
                          ? "#3B82F6"
                          : clr === "green"
                          ? "#22C55E"
                          : clr === "purple"
                          ? "#A855F7"
                          : "#F97316",
                    }}
                    onClick={() => {
                      setColorInput(clr);
                      handleUpdateSelectedNode({ color: clr });
                    }}
                  />
                ))}
              </div>

              <Button
                variant="destructive"
                className="w-full mt-3"
                onClick={() => handleDeleteNode(selectedNode.id)}
              >
                Delete Node
              </Button>
            </div>
          </div>
        )}

        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 w-1 cursor-col-resize h-full bg-gray-600 hover:bg-indigo-500 transition-colors"
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
onNodesChange={onNodesChange}
onEdgesChange={onEdgesChange}
onConnect={onConnect}
onNodeClick={(e, node) => setSelectedNode(node)}
fitView
nodeTypes={nodeTypes}
>
<Background />
<MiniMap nodeColor={() => "#6b21a8"} />
<Controls />
</ReactFlow>
</div>
</div>
);
}



         
