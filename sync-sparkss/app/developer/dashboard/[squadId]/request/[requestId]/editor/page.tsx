"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Stage, Layer, Line } from "react-konva";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type Scene = {
  scene?: string;
  description?: string;
  mediaUrl?: string;
  drawing?: any;
};

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const squadId = params?.squadId as string;
  const requestId = params?.requestId as string;
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [aiFlow, setAiFlow] = useState<Scene[]>([]);
  const [curSceneIdx, setCurSceneIdx] = useState(0);
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = useRef(false);
  const [code, setCode] = useState<string>("");

  // Fetch data
  async function fetchRequest() {
    const res = await fetch(
      `http://localhost:4000/api/developer/squad/${squadId}`,
      { credentials: "include" }
    );
    const data = await res.json();
    const req = (data.squad.requests || []).find(
      (r: any) => r._id === requestId
    );
    setRequest(req);
    setAiFlow(
      req?.aiFlow?.length ? req.aiFlow : [{ scene: "Scene 1", description: "" }]
    );
    setCode(req?.code ?? "");
  }

  useEffect(() => {
    if (squadId && requestId) fetchRequest();
  }, [squadId, requestId]);

  // Drawing handlers
  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    setLines((l) => [...l, { points: [pos.x, pos.y] }]);
  };
  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      const updatedLast = {
        ...last,
        points: last.points.concat([point.x, point.y]),
      };
      return [...prev.slice(0, -1), updatedLast];
    });
  };
  const handleMouseUp = () => {
    isDrawing.current = false;
  };
  const saveDrawingToScene = () => {
    const copy = [...aiFlow];
    copy[curSceneIdx] = { ...copy[curSceneIdx], drawing: lines };
    setAiFlow(copy);
    alert("Drawing saved for this scene.");
  };

  // AI Image Generator
  const generateImageFromScene = async () => {
    const desc = aiFlow[curSceneIdx]?.description || "";
    if (!desc.trim()) return alert("Please write a description first!");

    try {
      const copy = [...aiFlow];
      copy[curSceneIdx] = { ...copy[curSceneIdx], mediaUrl: "" };
      setAiFlow(copy);
      const res = await fetch(
        "http://localhost:4000/api/developer/generate-image",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: desc }),
        }
      );

      const data = await res.json();

      if (data.success && data.imageUrl) {
        const updated = [...aiFlow];
        updated[curSceneIdx] = {
          ...updated[curSceneIdx],
          mediaUrl: data.imageUrl,
          //loading: false,
        };
        setAiFlow(updated);
      } else {
        alert("Image generation failed.");
      }
    } catch (err) {
      console.error("Image generation error:", err);
      alert("Error generating image");
    }
  };

  // Text-to-speech
  const produceSpeech = () => {
    const text = aiFlow[curSceneIdx]?.description || "";
    if (!("speechSynthesis" in window)) return alert("Speech not supported");
    const u = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(u);
  };

  // Generate code
  const generateCodeFromAiFlow = () => {
    const safe = JSON.stringify(aiFlow).replace(/</g, "\\u003c");
    const generated = `
<!doctype html><html><head><meta charset="utf-8"/><title>Preview</title>
<style>
body { background:#fff; color:#000; font-family:Inter,system-ui; padding:20px; }
.scene { margin-bottom:12px; padding:12px; border-radius:8px; background:#f7f7f7; border:1px solid #ddd; }
</style></head>
<body><h1>Scene Preview</h1><div id="container"></div>
<script>const flow=${safe};
const c=document.getElementById('container');
flow.forEach((s,i)=>{const d=document.createElement('div');
d.className='scene'; d.innerHTML='<h3>'+ (s.scene||'Scene '+(i+1)) +'</h3><p>'+ (s.description||'') +'</p>';
if(s.mediaUrl){d.innerHTML += '<img src="'+s.mediaUrl+'" style="max-width:100%"/>';} c.appendChild(d);});
</script></body></html>`;
    setCode(generated);
  };

  // Deploy
  const deploy = async (commitMessage = "Deploy from editor") => {
    const payload = {
      squadId,
      requestId,
      developerId: "DEV-" + Math.random().toString(36).slice(2, 8),
      developerName: "Developer",
      aiFlow,
      code,
      commitMessage,
    };
    try {
      const res = await fetch("http://localhost:4000/api/developer/push-work", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert("Deployed: " + data.deployedUrl);
        router.push(`/developer/dashboard/${squadId}`);
      } else {
        alert("Deploy failed: " + (data.message || "unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("Deploy failed");
    }
  };

  if (!request)
    return <div className="p-6 text-center text-black">Loading editor...</div>;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold">
            Editor — {request.writerName}
          </h1>
          <p className="text-sm text-gray-600">{request.idea}</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="text-white"
            variant="outline"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button onClick={() => deploy("Deploy from Editor")}>Deploy</Button>
        </div>
      </header>

      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="md:w-1/4 border-r border-gray-300 p-4 overflow-y-auto bg-gray-50">
          <h3 className="font-semibold mb-2">Scenes</h3>
          {aiFlow.map((s, i) => (
            <div
              key={i}
              onClick={() => setCurSceneIdx(i)}
              className={`p-3 mb-2 rounded cursor-pointer transition ${
                i === curSceneIdx
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <strong>{s.scene || `Scene ${i + 1}`}</strong>
              <p className="text-sm">{s.description?.slice(0, 60)}</p>
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() =>
                setAiFlow((prev) => [
                  ...prev,
                  { scene: `Scene ${prev.length + 1}`, description: "" },
                ])
              }
            >
              Add
            </Button>
            <Button
              className="text-white"
              variant="outline"
              onClick={() => setAiFlow((prev) => prev.slice(0, -1))}
            >
              Remove
            </Button>
          </div>
        </aside>

        {/* Editor Center */}
        <section className="flex-1 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-2">Edit Scene</h3>
          <Textarea
            value={aiFlow[curSceneIdx]?.description || ""}
            onChange={(e: any) => {
              const copy = [...aiFlow];
              copy[curSceneIdx].description = e.target.value;
              setAiFlow(copy);
            }}
            placeholder="Describe the scene..."
            className="w-full bg-gray-100 border border-gray-300 text-black"
          />

          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              onClick={() => {
                setActiveButton("image");
                generateImageFromScene();
              }}
              className={activeButton === "image" ? "text-white bg-black" : ""}
            >
              Generate Image
            </Button>

            <Button
              onClick={() => {
                setActiveButton("clear");
                setLines([]);
              }}
              className={activeButton === "clear" ? "text-white bg-black" : ""}
            >
              Clear Canvas
            </Button>
          </div>

          <div className="mt-4">
            <h4 className="mb-2">Canvas</h4>
            <Stage
              width={Math.min(500, window.innerWidth - 60)}
              height={250}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ border: "1px solid #999", background: "#fff" }}
            >
              <Layer>
                {lines.map((l, idx) => (
                  <Line
                    key={idx}
                    points={l.points}
                    stroke="black"
                    strokeWidth={2}
                    tension={0.5}
                    lineCap="round"
                  />
                ))}
              </Layer>
            </Stage>
            <div className="flex gap-2 mt-2">
              <Button onClick={saveDrawingToScene}>Save Drawing</Button>
            </div>
          </div>
          {/* Generated Image Preview */}
          {aiFlow[curSceneIdx]?.mediaUrl && (
            <div className="mt-6">
              <h4 className="mb-2 font-semibold">Generated Image</h4>
              <img
                src={aiFlow[curSceneIdx].mediaUrl}
                alt="Generated Scene"
                className="rounded-xl border border-gray-300 shadow-md max-w-full"
              />
            </div>
          )}
        </section>

        {/* Code Preview */}
        <section className="md:w-1/3 border-l border-gray-300 p-4 bg-gray-50 overflow-y-auto">
          <h3 className="font-semibold mb-2">Code & Preview</h3>

          <div style={{ height: 300 }}>
            <MonacoEditor
              height="100%"
              defaultLanguage="html"
              theme="vs-light"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
              }}
            />
          </div>

          <div className="flex gap-2 mt-3">
            <Button onClick={generateCodeFromAiFlow}>Auto-generate</Button>
            <Button onClick={() => deploy("Deploy from Editor")}>Deploy</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
