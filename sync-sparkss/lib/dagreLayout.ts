import * as dagre from "dagre";
import { Node, Edge, Position } from "reactflow";

const nodeWidth = 180;
const nodeHeight = 60;

export default function applyLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR" });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  nodes.forEach((node) => {
    const nodeWithPos = g.node(node.id);
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    node.position = {
      x: nodeWithPos.x - nodeWidth / 2,
      y: nodeWithPos.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
}
