"use client";

import React, { RefObject, useState } from "react";
import { Node, Edge } from "reactflow";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface MindNodeData {
  label: string;
  notes?: string;
  customNode?: boolean;
}

interface DownloadMindMapProps {
  mapId: string;
  nodes: Node<MindNodeData>[];
  edges: Edge[];
  containerRef: RefObject<HTMLDivElement | null>;
}

export default function DownloadMindMap({
  mapId,
  nodes,
  edges,
  containerRef,
}: DownloadMindMapProps) {
  const [notesOption, setNotesOption] = useState<"all" | "none" | "custom">("all");

  const handleDownload = async (format: "png" | "jpg" | "pdf") => {
    if (!containerRef.current) return alert("Flow container not available!");

    // Show/hide notes based on selection
    const nodeElements = containerRef.current.querySelectorAll(".react-flow__node");
    const originalDisplays: string[] = [];

    nodeElements.forEach((el, idx) => {
      const notesEl = el.querySelector(".node-notes-export") as HTMLElement;
      if (!notesEl) return;
      originalDisplays.push(notesEl.style.display);

      if (notesOption === "all") notesEl.style.display = "block";
      else if (notesOption === "none") notesEl.style.display = "none";
      else notesEl.style.display = nodes[idx].data.customNode ? "block" : "none";
    });

    try {
      const dataUrl =
        format === "jpg"
          ? await toJpeg(containerRef.current, { quality: 0.95, cacheBust: true })
          : await toPng(containerRef.current, { cacheBust: true });

      if (format === "pdf") {
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [containerRef.current.offsetWidth, containerRef.current.offsetHeight],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, containerRef.current.offsetWidth, containerRef.current.offsetHeight);
        pdf.save(`mindmap-${mapId}.pdf`);
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `mindmap-${mapId}.${format}`;
        link.click();
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export mind map.");
    } finally {
      nodeElements.forEach((el, idx) => {
        const notesEl = el.querySelector(".node-notes-export") as HTMLElement;
        if (!notesEl) return;
        notesEl.style.display = originalDisplays[idx];
      });
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Download ▼</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-36">
           <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownload("png")}>
            Download PNG
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownload("jpg")}>
            Download JPG
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownload("pdf")}>
            Download PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
