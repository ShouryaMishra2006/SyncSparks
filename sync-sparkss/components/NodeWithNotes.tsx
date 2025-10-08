// frontend/components/NodeWithNotes.tsx
// "use client";
// import React, { useState, useEffect } from "react";
// import { Handle, Position, NodeProps } from "reactflow";
// import { MindNodeData } from "../types/mindmap";

// type Props = NodeProps<MindNodeData>;
// type Data = {
//   label: string;
//   explanation?: string;
//   color?: string;
//   onLabelChange?: (label: string) => void;
//   onColorChange?: (color: string) => void;
// };


// // Safe Tailwind color styles (for background + border)
// const colorStyles: Record<string, string> = {
//   blue: "bg-blue-50 border-blue-300",
//   green: "bg-green-50 border-green-300",
//   red: "bg-red-50 border-red-300",
//   yellow: "bg-yellow-50 border-yellow-300",
//   purple: "bg-purple-50 border-purple-300",
//   gray: "bg-gray-50 border-gray-300",
// };

// export default function NodeWithNotes({ data, id, selected }: NodeProps<Data>) {
//   const [editing, setEditing] = useState(false);
//   const [label, setLabel] = useState(data.label || "");
//   const [notes, setNotes] = useState(data.notes || "");
//   const [showNotes, setShowNotes] = useState(false);

//   // 🔄 Sync with backend when data changes externally (from AI sync or load)
//   useEffect(() => {
//     setLabel(data.label || "");
//     setNotes(data.notes || "");
//   }, [data.label, data.notes]);

//   // 💾 Save changes (label, notes, color)
//   const saveLocal = () => {
//     if (typeof data.onSave === "function") {
//       data.onSave({
//         id,
//         label,
//         notes,
//         color: data.color,
//       });
//     }
//     setEditing(false);
//   };

//   // 🟦 Style based on color
//   const cls = data.color ? colorStyles[data.color] || colorStyles.gray : colorStyles.gray;

//   return (
//     <div
//       className={`rounded-lg border p-3 w-56 shadow-sm transition-all duration-200 ${cls} ${
//         selected ? "ring-2 ring-blue-400" : ""
//       }`}
//     >
//       {/* Handles for React Flow connections */}
//       <Handle type="target" position={Position.Left} />

//       {/* Node Header */}
//       <div className="flex items-start justify-between gap-2">
//         {/* Node Label */}
//         <div>
//           {!editing ? (
//             <div
//               onDoubleClick={() => setEditing(true)}
//               className="font-semibold text-gray-800 break-words"
//             >
//               {label || "Untitled Node"}
//             </div>
//           ) : (
//             <input
//               className="border rounded px-2 py-1 text-sm w-full"
//               value={label}
//               onChange={(e) => setLabel(e.target.value)}
//               onBlur={saveLocal}
//               onKeyDown={(e) => e.key === "Enter" && saveLocal()}
//               autoFocus
//             />
//           )}
//         </div>

//         {/* Selected Indicator */}
//         {selected && (
//           <span className="text-xs px-1 py-0.5 bg-white/60 rounded text-gray-600">●</span>
//         )}
//       </div>

//       {/* Controls */}
//       <div className="mt-2 flex items-center justify-between gap-2">
//         <button
//           className="text-xs text-blue-600 hover:underline"
//           onClick={() => setShowNotes((s) => !s)}
//         >
//           {showNotes ? "Hide notes" : "Notes"}
//         </button>

//         <button
//           className="text-xs text-gray-600 hover:text-gray-900"
//           onClick={() => setEditing((s) => !s)}
//         >
//           {editing ? "Close" : "Edit"}
//         </button>
//       </div>

//       {/* Notes Editor */}
//       {showNotes && (
//         <div className="mt-2 p-2 bg-white rounded text-xs text-gray-700 border">
//           <textarea
//             value={notes}
//             onChange={(e) => setNotes(e.target.value)}
//             className="w-full text-xs resize-none outline-none border-none focus:ring-0"
//             rows={4}
//             onBlur={saveLocal}
//           />
//         </div>
//       )}

//       <Handle type="source" position={Position.Right} />
//     </div>
//   );
// }



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
              {notes.trim() ? (
                notes
              ) : (
                <span className="text-gray-400">No notes yet</span>
              )}
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
