import { Handle, Position } from "reactflow";
import { useState } from "react";

interface NodeWithNotesProps {
  data: {
    label: string;
    notes?: string;
  };
}

export default function NodeWithNotes({ data }: NodeWithNotesProps) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="rounded-xl border bg-white shadow-md p-3 w-48 text-center relative">
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
      
      <div className="font-semibold text-gray-800">{data.label}</div>

      <button
        className="text-xs text-blue-600 underline mt-2"
        onClick={() => setShowNotes(!showNotes)}
      >
        {showNotes ? "Hide Notes" : "Show Notes"}
      </button>

      {showNotes && data.notes && (
        <div className="mt-2 p-2 text-xs bg-gray-100 rounded">
          {data.notes}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-green-500" />
    </div>
  );
}
