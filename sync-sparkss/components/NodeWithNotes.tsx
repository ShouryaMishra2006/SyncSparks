
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
const { ChevronDown } = require ("lucide-react");
import { MindNodeData, NodeColor } from "@/types/mindmap";

const colorMap: Record<string, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
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
  const shapeClasses =
    data.shape === "circle"
      ? "rounded-full"
      : data.shape === "rounded"
      ? "rounded-lg"
      : "rounded-none";
  // Sync updates from sidebar
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
  
  

      



  return (
    <div
      className={`p-3 shadow-md border-2  transition-all duration-300 flex flex-col justify-center items-center ${shapeClasses}`}
      style={{
        //borderRadius: shape === "circle" ? "50%" : shape === "rounded" ? "16px" : "4px",
        width: data.width ?? 140,
        height: data.height ?? 80,
        backgroundColor: colorMap[data.color ?? "blue"],
        minWidth: 100,
        maxWidth: 280,
        // height removed to allow dynamic sizing
        whiteSpace: "normal",       // allow wrapping
        wordBreak: "break-word",     // break long words
        overflowWrap: "break-word",  // ensures wrapping of long words
        textAlign: "center",
        
        alignItems: "center",

      }}
    >
      {/* Label and Toggle Section */}
      <div className="w-full flex justify-between items-center mb-2">
        {editingLabel ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={(e) => {
              setEditingLabel(false);
              data.onSave?.({ ...data, label: e.target.value });
            }}
            className="text-sm font-semibold bg-transparent border-b border-gray-400 focus:outline-none w-full"
            autoFocus
          />
        ) : (
          <h4
            className="font-bold text-sm cursor-pointer  hover:underline break-words whitespace-normal text-center"
            onClick={() => setEditingLabel(true)}
          >
            {label}
          </h4>
        )}

<button
          onClick={() => setShowNotes((prev) => !prev)}
          className="ml-2 p-1 rounded-full bg-white/70 hover:bg-gray-100 border text-gray-600 hover:text-black transition"
          title="Toggle notes"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              showNotes ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Notes Section (Expandable) */}
      {showNotes && (
        <div className="p-2 bg-white/70 border rounded text-xs text-black mt-1">
          {editingNotes ? (
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                setEditingNotes(false);
                data.onSave?.({ ...data, notes });
              }}
              className="w-full p-1 border border-gray-300 rounded text-xs focus:outline-none resize-none"
              rows={Math.min(6, notes.split("\n").length + 1)}
              style={{ height: "auto" }}
            />
          ) : (
            <div
              className="cursor-pointer whitespace-pre-wrap"
              onClick={() => setEditingNotes(true)}
              >
                <div className="node-notes-export" style={{ display: editingNotes ? "block" : "block" }}>

              {notes.trim() ? (
                notes
              ) : (
                <span className="text-gray-400">No notes yet</span>
              )}
              </div>
            </div>
          )}
        </div>
      )}
  


      {/* Color Picker */}
      {/* <div className="flex justify-between mt-2">
        {(Object.keys(colorMap) as NodeColor[]).map((clr) => (
          <button
            key={clr}
            onClick={() => {
              
              data.onSave?.({ ...data, color: clr });
            }}
            className={`w-5 h-5 rounded-full border-2 ${
              clr === data.color ? "border-gray-800" : "border-gray-300"
            } ${
              clr === "blue"
                ? "bg-blue-400"
                : clr === "green"
                ? "bg-green-400"
                : clr === "purple"
                ? "bg-purple-400"
                : "bg-orange-400"
            }`}
            title={clr}
          />
        ))}
      </div> */}

      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
