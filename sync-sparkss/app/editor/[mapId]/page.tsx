"use client";
import { useSearchParams, useRouter } from "next/navigation";
import EditableMindMap from "@/components/EditableMindMap";

export default function MindMapEditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();;

  // retrieve data passed via router.push(..., { state })
// Parse query params safely
const nodes = JSON.parse(searchParams.get("nodes") || "[]");
const edges = JSON.parse(searchParams.get("edges") || "[]");
return (
  <EditableMindMap
    initialNodes={nodes}
    initialEdges={edges}
    onCloseEditor={() => router.back()}
  />
  );
}
