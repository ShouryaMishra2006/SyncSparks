// frontend/types/mindmap.ts
import { Node, Edge } from "reactflow";
/* ---------- BASE NODE TYPES ---------- */

export type NodeColor = "blue" | "green" | "red" | "yellow" | "purple" |"orange"| "gray";
export interface MindMapViewProps {
  mapId: string;
  initialData?: {
    nodes: MindNodeData[];
        edges: RFEdge[];
  };
}

export interface MindNodeData {
  label: string;
  notes?: string;
  color?: NodeColor;
  width?: number;
  height?: number;
  shape?: "rectangle" | "rounded" | "circle";
  onSave?: (payload: any) => void;
}

export type RFNode = Node<MindNodeData>;
export type RFEdge = Edge;

