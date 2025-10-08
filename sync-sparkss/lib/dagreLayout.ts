// frontend/lib/dagreLayout.ts
// lib/useDagre.ts
import dagre from "dagre";
import { Node, Edge } from "reactflow";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;

export function layoutElements(
  nodes: Node[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR"
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((n) =>
    dagreGraph.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  );
console.log("edges:", edges);
  // Ensure edges reference correct node IDs
  const updatedEdges = edges.map((e) => ({
    ...e,
    source: typeof e.source === "string" ? `ai-node-${e.source}` : e.source,
    target: typeof e.target === "string" ? `ai-node-${e.target}` : e.target,
  }));
  console.log("updated edges:", updatedEdges)

  updatedEdges.forEach((e) => dagreGraph.setEdge(e.source, e.target));

  dagre.layout(dagreGraph);

  const laidNodes = nodes.map((n) => {
    const nodeWithPosition = dagreGraph.node(n.id);
    return {
      ...n,
      position: {
        x: (nodeWithPosition?.x ?? 0) - NODE_WIDTH / 2,
        y: (nodeWithPosition?.y ?? 0) - NODE_HEIGHT / 2,
      },
      // Keep nodes draggable
      draggable: true,
      data: { ...n.data },
    };
  });

  // Leave edges as-is (React Flow will handle them dynamically)
  return { nodes: laidNodes, edges: updatedEdges };
}
