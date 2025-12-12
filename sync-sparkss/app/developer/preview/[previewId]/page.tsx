"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function PreviewViewer() {
  const params = useParams();
  const previewId = params?.previewId!;
  const [meta, setMeta] = useState<any>(null);
  const [code, setCode] = useState<string>("");
  const [runSrc, setRunSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      const res = await fetch(`http://localhost:4000/api/developer/preview/${previewId}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        console.log(data)
        setMeta(data.preview);
        setCode(data.preview.code || "");
        setRunSrc(data.preview.deployedPreviewUrl || `/previews/${previewId}/index.html`);
      }
    };
    fetchMeta();
  }, [previewId]);

  if (!meta) return <div className="p-6 text-white">Loading preview...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">Preview Editor</h1>
      <p className="text-gray-300 mb-4">Preview ID: {previewId} — Deployed: {new Date(meta.deployedAt).toLocaleString()}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Code</h2>
          <div style={{height: 500}}>
            <MonacoEditor height="100%" defaultLanguage="html" value={code} onChange={(v) => setCode(v || "")} />
          </div>
        </div>

        <div>
          {/* <h2 className="font-semibold mb-2">Run</h2> */}
          {/* <div className="mb-2">
            <Button onClick={() => setRunSrc(`/previews/${previewId}/index.html`)}>Load Preview</Button>
          </div> */}
          {runSrc && <iframe src={runSrc} className="w-full h-[520px] border rounded" />}
        </div>
      </div>
    </div>
  );
}
