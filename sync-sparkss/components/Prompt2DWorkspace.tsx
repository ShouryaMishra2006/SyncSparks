"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type Prompt2DSceneResponse = {
  success: boolean;
  connected?: boolean;
  code?: string;
  referenceCode?: string;
  prompt2dRoot?: string;
  demoScenePath?: string;
  referenceScenePath?: string;
  path?: string;
  previewUrl?: string;
  message?: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const DEMO_SCENE_ENDPOINT = `${BACKEND_URL}/api/developer/prompt2d/demo-scene`;

export default function Prompt2DWorkspace() {
  const [code, setCode] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [filePath, setFilePath] = useState("");
  const [referencePath, setReferencePath] = useState("");
  const [previewUrl, setPreviewUrl] = useState("http://localhost:5173");
  const [previewKey, setPreviewKey] = useState(0);
  const [status, setStatus] = useState("Connecting to prompt2d...");
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDemoScene = async () => {
    setStatus("Connecting to prompt2d...");
    try {
      const res = await fetch(DEMO_SCENE_ENDPOINT, {
        cache: "no-store",
        credentials: "include",
      });
      const data: Prompt2DSceneResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to load prompt2d demo scene.");
      }
      setCode(data.code || "");
      setReferenceCode(data.referenceCode || data.code || "");
      setFilePath(data.demoScenePath || data.path || "");
      setReferencePath(data.referenceScenePath || "");
      setPreviewUrl(data.previewUrl || "http://localhost:5173");
      setConnected(Boolean(data.connected));
      setStatus("Connected to prompt2d.");
    } catch (error) {
      setConnected(false);
      setStatus(error instanceof Error ? error.message : "Unable to load prompt2d demo scene.");
    }
  };

  useEffect(() => {
    loadDemoScene();
  }, []);

  const saveDemoScene = async () => {
    setSaving(true);
    setStatus("Saving demo-scene.ts...");
    try {
      const res = await fetch(DEMO_SCENE_ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data: Prompt2DSceneResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to save prompt2d demo scene.");
      }
      setConnected(Boolean(data.connected));
      setStatus("Saved to prompt2d. The preview will hot reload when the prompt2d dev server is running.");
      setPreviewKey((key) => key + 1);
    } catch (error) {
      setConnected(false);
      setStatus(error instanceof Error ? error.message : "Unable to save prompt2d demo scene.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 border border-cyan-500/30 bg-black/55 p-4 text-white">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">prompt2d Frontend Preview</h2>
            <span
              className={`rounded px-2 py-1 text-xs ${
                connected
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "bg-red-500/15 text-red-200"
              }`}
            >
              {connected ? "Backend connected" : "Backend disconnected"}
            </span>
          </div>
          {filePath && <p className="mt-1 text-xs text-cyan-200">{filePath}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadDemoScene} variant="outline" className="text-white">
            Reload Code
          </Button>
          <Button onClick={() => setPreviewKey((key) => key + 1)} variant="outline" className="text-white">
            Reload Preview
          </Button>
          <Button onClick={saveDemoScene} disabled={saving || !connected}>
            {saving ? "Saving..." : "Save demo-scene.ts"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="min-h-[520px] overflow-hidden border border-gray-700 bg-zinc-950">
          <div className="border-b border-gray-800 px-3 py-2 text-sm text-gray-300">
            Editable: src/constants/demo-scene.ts
          </div>
          <MonacoEditor
            height="500px"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <div className="min-h-[520px] overflow-hidden border border-gray-700 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700">
            <span>Frontend Preview</span>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">
              {previewUrl}
            </a>
          </div>
          <iframe
            key={previewKey}
            src={`${previewUrl}?syncsparksPreview=${previewKey}`}
            className="h-[500px] w-full border-0"
            title="prompt2d frontend preview"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden border border-gray-700 bg-zinc-950">
        <div className="border-b border-gray-800 px-3 py-2 text-sm text-gray-300">
          Reference: {referencePath || "src/constants/demo-scene-tester.ts"}
        </div>
        <MonacoEditor
          height="360px"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={referenceCode}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <p className="mt-3 text-sm text-gray-300">{status}</p>
    </section>
  );
}
