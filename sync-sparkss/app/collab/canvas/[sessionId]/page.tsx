"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

type CanvasElement = {
  id: string;
  type: "card";
  heading: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Session = {
  _id: string;
  name: string;
  invitationCode: string;
  participants: Array<{ _id: string; name: string }>;
};

export default function CollaborationCanvas() {
  const { user, loading, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newCardHeading, setNewCardHeading] = useState("");
  const [newCardContent, setNewCardContent] = useState("");

  // Toolbar dragging state
  const [toolbarPosition, setToolbarPosition] = useState({ x: 16, y: 96 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [toolbarDragOffset, setToolbarDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const elementsMapRef = useRef<Y.Map<unknown> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;

    // Fetch session details
    const fetchSession = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/collab/session/${sessionId}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (res.ok) {
          setSession(data);
        } else {
          alert(data.message || "Failed to fetch session");
          router.push("/collab/hub");
        }
      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    };

    fetchSession();

    // Initialize Y.js
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(
      "ws://localhost:4000/yjs",
      sessionId,
      ydoc
    );
    providerRef.current = provider;

    const elementsMap = ydoc.getMap("elements");
    elementsMapRef.current = elementsMap;

    // Sync local state with Y.js
    const updateLocalState = () => {
      const elementsArray: CanvasElement[] = [];
      elementsMap.forEach((value, key) => {
        const element = value as Omit<CanvasElement, "id">;
        elementsArray.push({ id: key, ...element });
      });
      setElements(elementsArray);
    };

    updateLocalState();

    // Listen for changes
    elementsMap.observe(updateLocalState);

    // Load saved canvas data from database
    const loadCanvasData = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/collab/session/${sessionId}/canvas`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.canvasData && typeof data.canvasData === "object") {
            // Load saved elements into Y.js map
            Object.entries(data.canvasData).forEach(([key, value]) => {
              if (!elementsMap.has(key)) {
                elementsMap.set(key, value);
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to load canvas data:", err);
      }
    };

    loadCanvasData();

    // Auto-save canvas data every 5 seconds
    const saveInterval = setInterval(async () => {
      const canvasData: Record<string, unknown> = {};
      elementsMap.forEach((value, key) => {
        canvasData[key] = value;
      });

      try {
        await fetch(
          `http://localhost:4000/api/collab/session/${sessionId}/canvas`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ canvasData }),
          }
        );
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 5000);

    return () => {
      clearInterval(saveInterval);
      provider.destroy();
      ydoc.destroy();
    };
  }, [isAuthenticated, sessionId, router]);

  if (loading) return <div className="text-white p-10">Loading...</div>;

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white">
        <p className="mb-4">You are not logged in.</p>
        <Link href="/login">
          <Button className="bg-purple-600">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const handleAddTextbox = () => {
    if (!newCardHeading.trim() || !elementsMapRef.current) return;

    const newElement = {
      type: "card" as const,
      heading: newCardHeading,
      content: newCardContent,
      x: 150 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      width: 300,
      height: 200,
    };

    const id = `card-${Date.now()}-${Math.random()}`;
    elementsMapRef.current.set(id, newElement);
    setNewCardHeading("");
    setNewCardContent("");
  };

  const handleDeleteElement = (elementId: string) => {
    if (!elementsMapRef.current) return;
    elementsMapRef.current.delete(elementId);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    elementId: string,
    element: CanvasElement
  ) => {
    // Only drag if clicking on the header area
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
      return; // Don't drag when editing
    }

    e.preventDefault();
    e.stopPropagation();

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    setDraggedElement(elementId);
    setDragOffset({
      x: e.clientX - element.x - canvasRect.left,
      y: e.clientY - element.y - canvasRect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedElement || !elementsMapRef.current || !canvasRef.current)
      return;

    const element = elements.find((el) => el.id === draggedElement);
    if (!element) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - dragOffset.x - canvasRect.left;
    const newY = e.clientY - dragOffset.y - canvasRect.top;

    // Constrain to canvas bounds
    const constrainedX = Math.max(
      0,
      Math.min(newX, canvasRect.width - element.width)
    );
    const constrainedY = Math.max(
      0,
      Math.min(newY, canvasRect.height - element.height)
    );

    elementsMapRef.current.set(draggedElement, {
      type: element.type,
      heading: element.heading,
      content: element.content,
      x: constrainedX,
      y: constrainedY,
      width: element.width,
      height: element.height,
    });
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
  };

  const handleElementContentChange = (
    elementId: string,
    newContent: string
  ) => {
    if (!elementsMapRef.current) return;

    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    elementsMapRef.current.set(elementId, {
      type: element.type,
      heading: element.heading,
      content: newContent,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    });
  };

  const handleElementHeadingChange = (
    elementId: string,
    newHeading: string
  ) => {
    if (!elementsMapRef.current) return;

    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    elementsMapRef.current.set(elementId, {
      type: element.type,
      heading: newHeading,
      content: element.content,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    });
  };

  // Toolbar drag handlers
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    setIsDraggingToolbar(true);
    setToolbarDragOffset({
      x: e.clientX - toolbarPosition.x,
      y: e.clientY - toolbarPosition.y,
    });
  };

  const handleToolbarMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingToolbar) return;

    const newX = e.clientX - toolbarDragOffset.x;
    const newY = e.clientY - toolbarDragOffset.y;

    // Constrain to viewport
    const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - 280));
    const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - 400));

    setToolbarPosition({ x: constrainedX, y: constrainedY });
  };

  const handleToolbarMouseUp = () => {
    setIsDraggingToolbar(false);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white overflow-hidden"
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleToolbarMouseMove(e);
      }}
      onMouseUp={() => {
        handleMouseUp();
        handleToolbarMouseUp();
      }}
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-b border-purple-600/40 p-4 z-50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {session?.name || "Loading..."}
            </h1>
            <p className="text-sm text-gray-400">
              {session?.participants?.length || 0} participant(s)
            </p>
          </div>
          <div className="flex items-center gap-4">
            {session?.invitationCode && (
              <div className="bg-purple-900/30 px-4 py-2 rounded border border-purple-600/30">
                <p className="text-xs text-gray-400">Invitation Code:</p>
                <p className="font-mono font-bold text-purple-300">
                  {session.invitationCode}
                </p>
              </div>
            )}
            <Link href="/collab/hub">
              <Button variant="outline" size="sm">
                Back to Hub
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Toolbar - Draggable */}
      <div
        className={`fixed bg-black/90 backdrop-blur-sm border border-purple-600/40 rounded-lg z-40 shadow-xl ${
          isDraggingToolbar ? "cursor-grabbing" : ""
        }`}
        style={{
          left: `${toolbarPosition.x}px`,
          top: `${toolbarPosition.y}px`,
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex items-center justify-between px-4 py-2 bg-purple-900/30 border-b border-purple-600/30 rounded-t-lg cursor-grab active:cursor-grabbing"
          onMouseDown={handleToolbarMouseDown}
        >
          <h3 className="text-sm font-semibold text-purple-300">📝 Add Card</h3>
          <div className="text-gray-400 text-xs">⋮⋮</div>
        </div>

        {/* Toolbar Content */}
        <div className="p-4">
          <div className="space-y-3">
            <Input
              placeholder="Card heading..."
              value={newCardHeading}
              onChange={(e) => setNewCardHeading(e.target.value)}
              className="w-56 bg-gray-900/50 border-purple-600/30"
            />
            <textarea
              placeholder="Card content (optional)..."
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              className="w-56 h-20 bg-gray-900/50 border border-purple-600/30 rounded-md p-2 text-sm text-white resize-none outline-none"
            />
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleAddTextbox}
              disabled={!newCardHeading.trim()}
            >
              + Add Card
            </Button>
            <div className="pt-2 border-t border-purple-600/30">
              <p className="text-xs text-gray-500">
                💡 Tip: Drag this panel by the header to move it
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="absolute inset-0 top-20 left-0 right-0 bottom-0 bg-gradient-to-br from-gray-900/50 to-black/50"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          handleToolbarMouseUp();
        }}
      >
        {elements.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-xl mb-2">🎨 Empty Canvas</p>
              <p className="text-sm">
                Add cards from the left toolbar to get started!
              </p>
            </div>
          </div>
        )}

        {elements.map((element) => (
          <div
            key={element.id}
            className={`absolute bg-gradient-to-br from-purple-900/60 to-blue-900/60 backdrop-blur-md border-2 rounded-xl shadow-2xl transition-all overflow-hidden ${
              draggedElement === element.id
                ? "cursor-grabbing scale-105 shadow-purple-500/50 z-50 border-purple-400"
                : "hover:border-purple-400 hover:shadow-purple-500/30 border-purple-500/50"
            }`}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
            }}
          >
            {/* Header - Draggable Area */}
            <div
              className={`flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-800/50 to-blue-800/50 border-b border-purple-500/30 ${
                draggedElement === element.id
                  ? "cursor-grabbing"
                  : "cursor-grab"
              }`}
              onMouseDown={(e) => handleMouseDown(e, element.id, element)}
            >
              <input
                type="text"
                className="flex-1 bg-transparent text-white font-semibold text-sm outline-none placeholder-gray-400"
                value={element.heading}
                onChange={(e) =>
                  handleElementHeadingChange(element.id, e.target.value)
                }
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="Card heading..."
              />
              <div className="flex items-center gap-2">
                <button
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded p-1 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this card?")) {
                      handleDeleteElement(element.id);
                    }
                  }}
                  title="Delete card"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <div className="text-gray-400 text-xs cursor-grab">⋮⋮</div>
              </div>
            </div>

            {/* Content - Editable Area */}
            <div className="p-3 h-[calc(100%-44px)] overflow-auto">
              <textarea
                className="w-full h-full bg-transparent text-white placeholder-gray-400 resize-none outline-none text-sm leading-relaxed"
                value={element.content}
                onChange={(e) =>
                  handleElementContentChange(element.id, e.target.value)
                }
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="Type your content here..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
