
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
const { ChevronDown } = require ("lucide-react");
import { MindNodeData, NodeColor } from "@/types/mindmap";

const colorMap: Record<string, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "bg-yellow-50 border-yellow-300",
  purple: "#A855F7",
  orange: "#F97316",
};

type Props = NodeProps<MindNodeData>;

export default function NodeWithNotes({ data }: Props) {
  const [label, setLabel] = useState(data.label);
  const [notes, setNotes] = useState(data.notes || "");
  const [color, setColor] = useState<NodeColor>(data.color || "blue");
  const [showNotes, setShowNotes] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [width, setWidth] = useState(data.width || 200);
  const [height, setHeight] = useState(data.height || 100);
  const [shape, setShape] = useState(data.shape || "rounded");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

   const containerRef = useRef<HTMLDivElement>(null);

   // Auto-fit content initially
   useEffect(() => {
    if (containerRef.current && (!data.width || !data.height)) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(140, rect.width);
      const newHeight = Math.max(80, rect.height);
      setWidth(newWidth);
      setHeight(newHeight);
      data.onSave?.({ ...data, width: newWidth, height: newHeight });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setLabel(data.label);
    setNotes(data.notes || "");
   //setColor(data.color || "blue");
  }, [data]);

  useEffect(() => {
    if (editingNotes && textareaRef.current) textareaRef.current.focus();
  }, [editingNotes]);
  useEffect(() => {
    setShape(data.shape || "rounded");
    setColor(data.color || "blue");
    setWidth(data.width || 200);
    setHeight(data.height || 100)
  }, [data.shape, data.color, data.width, data.height]);
  
  
const saveNotes = () => {
    data.onSave?.({ ...data, notes });
    setEditingNotes(false);
  };
      



  return (
  <div
  ref={containerRef}
    className={`p-2 shadow-md border-2 transition-all duration-300 flex flex-col items-center justify-start `}
    style={{
      backgroundColor: colorMap[data.color ?? "blue"],
      minWidth: 100,
      maxWidth: 280,
      width: data.width,
        height: data.height,
      whiteSpace: "pre-wrap", // allow wrapping
      wordBreak: "break-word", // break long words
      overflowWrap: "break-word",
      textAlign: "center",
    }}
  >
    {/* Label */}
    {editingLabel ? (
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => {
          setEditingLabel(false);
          data.onSave?.({ ...data, label });
        }}
        className="text-sm font-semibold bg-transparent border-b border-gray-400 focus:outline-none w-full text-center"
        autoFocus
      />
    ) : (
      <h4
        className="font-bold text-sm cursor-pointer break-words whitespace-pre-wrap text-center w-full"
        onClick={() => setEditingLabel(true)}
      >
        {label}
      </h4>
    )}

    {/* Notes Section */}
    {/* Toggle notes */}
          <button
            className="ml-2 p-1 rounded-full bg-white/70 hover:bg-gray-100 border text-gray-600 hover:text-black transition"
            title={showNotes ? "Hide notes" : "Show notes"}
            onClick={() => setShowNotes((prev) => !prev)}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showNotes ? "rotate-180" : ""
              }`}
            />
          </button>
       
    {/* Notes */}
      {showNotes && (
        <div
          className="px-1 py-0.5 bg-white/80 rounded w-full text-xs text-black break-words whitespace-pre-wrap"
          style={{ minHeight: 20 }}
        >
          {editingNotes ? (
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              className="w-full p-1 border border-gray-300 rounded text-xs focus:outline-none resize-none"
              rows={Math.min(6, notes.split("\n").length + 1)}
              style={{ height: "auto" }}
            />
          ) : (
            <div
            className="cursor-pointer w-full"
              onClick={() => setEditingNotes(true)}
            >
              {notes.trim() ? notes : <span className="text-gray-400">No notes yet</span>}
            </div>
          )}
        </div>
      )}

    {/* Connection Handles */}
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
  </div>
);

}
