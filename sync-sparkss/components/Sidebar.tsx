"use client";

export default function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="p-4 border-r bg-gray-100 w-48">
      <h2 className="font-semibold mb-3">Add Nodes</h2>
      <div
        className="p-2 mb-2 bg-white border rounded cursor-grab hover:bg-gray-50"
        onDragStart={(event) => onDragStart(event, "notesNode")}
        draggable
      >
        + Note Node
      </div>
    </aside>
  );
}
