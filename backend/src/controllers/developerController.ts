import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import DeveloperSquad from "../models/DeveloperSquad";
import User from "../models/User";
import path from "path";
import fs from "fs/promises";
import OpenAI from "openai";
let Octokit;
(async () => {
  const mod = await import("@octokit/rest");
  Octokit = mod.Octokit;
})();

import axios from "axios";

const PROMPT2D_ROOT = process.env.PROMPT2D_ROOT || "E:\\Private\\prompt2d";
const PROMPT2D_PREVIEW_URL =
  process.env.PROMPT2D_PREVIEW_URL || "http://localhost:5173";
const PROMPT2D_DEMO_SCENE_PATH = path.join(
  PROMPT2D_ROOT,
  "src",
  "constants",
  "demo-scene.ts"
);
const PROMPT2D_REFERENCE_SCENE_PATH = path.join(
  PROMPT2D_ROOT,
  "src",
  "constants",
  "demo-scene-tester.ts"
);

export const getPrompt2dDemoScene = async (_req: Request, res: Response) => {
  try {
    const [code, referenceCode] = await Promise.all([
      fs.readFile(PROMPT2D_DEMO_SCENE_PATH, "utf8"),
      fs.readFile(PROMPT2D_REFERENCE_SCENE_PATH, "utf8").catch(() => ""),
    ]);

    return res.status(200).json({
      success: true,
      connected: true,
      prompt2dRoot: PROMPT2D_ROOT,
      demoScenePath: PROMPT2D_DEMO_SCENE_PATH,
      referenceScenePath: PROMPT2D_REFERENCE_SCENE_PATH,
      previewUrl: PROMPT2D_PREVIEW_URL,
      code,
      referenceCode,
    });
  } catch (error) {
    console.error("getPrompt2dDemoScene error:", error);
    return res.status(500).json({
      success: false,
      connected: false,
      prompt2dRoot: PROMPT2D_ROOT,
      demoScenePath: PROMPT2D_DEMO_SCENE_PATH,
      previewUrl: PROMPT2D_PREVIEW_URL,
      message:
        error instanceof Error
          ? error.message
          : "Unable to read prompt2d demo-scene.ts",
    });
  }
};

export const updatePrompt2dDemoScene = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "demo-scene.ts code is required.",
      });
    }

    await fs.writeFile(PROMPT2D_DEMO_SCENE_PATH, code, "utf8");

    return res.status(200).json({
      success: true,
      connected: true,
      prompt2dRoot: PROMPT2D_ROOT,
      demoScenePath: PROMPT2D_DEMO_SCENE_PATH,
      previewUrl: PROMPT2D_PREVIEW_URL,
      message: "prompt2d demo-scene.ts updated.",
    });
  } catch (error) {
    console.error("updatePrompt2dDemoScene error:", error);
    return res.status(500).json({
      success: false,
      connected: false,
      prompt2dRoot: PROMPT2D_ROOT,
      demoScenePath: PROMPT2D_DEMO_SCENE_PATH,
      previewUrl: PROMPT2D_PREVIEW_URL,
      message:
        error instanceof Error
          ? error.message
          : "Unable to save prompt2d demo-scene.ts",
    });
  }
};

export const createDeveloperSquad = async (req: Request, res: Response) => {
  try {
    const { name, description, password } = req.body;
    const user = (req as any).user;
    console.log("me user:", user);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!name || !description || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, description, and password are required.",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const newSquad = new DeveloperSquad({
      name,
      description,
      password: hashedPassword,
      inviteCode,
      developers: [user._id],
    });

    await newSquad.save();
    const developerUser = await User.findById(user._id);
    if (!developerUser) {
      return res
        .status(404)
        .json({ success: false, message: "Developer not found." });
    }

    if (!developerUser.developer) {
      developerUser.developer = {
        squadsJoined: [],
        requestsReceived: [],
      } as any;
    }

    developerUser.developer?.squadsJoined.push(newSquad._id);
    await developerUser.save();

    return res.status(201).json({
      success: true,
      message: "Developer Squad created successfully.",
      squad: {
        id: newSquad._id,
        name: newSquad.name,
        description: newSquad.description,
        inviteCode: newSquad.inviteCode,
      },
    });
  } catch (error) {
    console.error("Error creating Developer Squad:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating developer squad.",
    });
  }
};

export const joinDeveloperSquad = async (req: Request, res: Response) => {
  try {
    const { inviteCode, password } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!inviteCode || !password) {
      return res.status(400).json({
        success: false,
        message: "Invite code and password are required.",
      });
    }

    const squad = await DeveloperSquad.findOne({ inviteCode });
    if (!squad) {
      return res
        .status(404)
        .json({ success: false, message: "Squad not found." });
    }
    const isPasswordCorrect = await bcrypt.compare(password, squad.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password." });
    }

    const isAlreadyJoined = squad.developers.some(
      (id) => id.toString() === user._id
    );
    if (isAlreadyJoined) {
      return res.status(400).json({
        success: false,
        message: "You have already joined this squad.",
      });
    }

    squad.developers.push(user._id);
    await squad.save();

    const developerUser = await User.findById(user._id);
    if (!developerUser) {
      return res
        .status(404)
        .json({ success: false, message: "Developer not found." });
    }

    if (!developerUser.developer) {
      developerUser.developer = {
        squadsJoined: [],
        requestsReceived: [],
      } as any;
    }

    developerUser.developer?.squadsJoined.push(squad._id);
    await developerUser.save();

    return res.status(200).json({
      success: true,
      message: `Successfully joined squad: ${squad.name}`,
      squad: {
        id: squad._id,
        name: squad.name,
        description: squad.description,
        inviteCode: squad.inviteCode,
      },
    });
  } catch (err) {
    console.error("Error joining squad:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
export const getDeveloperSquadDetails = async (req: Request, res: Response) => {
  try {
    const { squadId } = req.params;
    if (!squadId) {
      return res
        .status(400)
        .json({ success: false, message: "Squad ID is required" });
    }
    const squad = await DeveloperSquad.findById(squadId).populate(
      "developers",
      "name email"
    );
    if (!squad) {
      return res
        .status(404)
        .json({ success: false, message: "Squad not found" });
    }

    return res.status(200).json({
      success: true,
      squad: {
        id: squad._id,
        name: squad.name,
        description: squad.description,
        inviteCode: squad.inviteCode,
        requests: squad.requests,
        developers: squad.developers,
      },
    });
  } catch (err) {
    console.error("Error fetching squad details:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getAllDeveloperSquads = async (req: Request, res: Response) => {
  try {
    const squads = await DeveloperSquad.find({}, "name inviteCode");
    res.status(200).json({ success: true, squads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch squads" });
  }
};
export const searchDeveloperSquadByCode = async (
  req: Request,
  res: Response
) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invite code is required" });
    }

    const squad = await DeveloperSquad.findOne({ inviteCode: code }).select(
      "_id name inviteCode"
    );
    if (!squad) {
      return res
        .status(404)
        .json({ success: false, message: "Squad not found" });
    }

    return res.status(200).json({ success: true, squad });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const sendIdeaToSquad = async (req: Request, res: Response) => {
  try {
    const { squadId, idea, aiFlow } = req.body;
    const user = (req as any).user; // from requireAuth middleware

    if (!user?.writer?.writerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!squadId || !idea) {
      return res
        .status(400)
        .json({ success: false, message: "Squad ID and idea are required" });
    }

    const squad = await DeveloperSquad.findById(squadId);
    console.log("send to :", squad);
    if (!squad) {
      return res
        .status(404)
        .json({ success: false, message: "Squad not found" });
    }
    // requests: [
    //     {
    //       writerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    //       writerName: { type: String, required: true },
    //       idea: { type: String, required: true },
    //       submittedAt: { type: Date, default: Date.now },
    //       markAsDone: { type: Boolean, default: false },
    //     },
    squad.requests.push({
      writerId: user.writer.writerId,
      writerName: user.name,
      idea,
      aiFlow: aiFlow || [],
    });

    await squad.save();

    return res
      .status(200)
      .json({ success: true, message: "Idea sent to developer squad" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper: simple escape
function escapeHtml(s: string) {
  return String(s).replace(
    /[&<>"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );
}

/**
 * Get all developer squads (simple)
 */

/**
 * Search by invite code (indexed)
 * GET /api/developer/squads/search?code=XXXX
 */
export const sendIdeaToDeveloperSquad = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { squadId, idea } = req.body;
    if (!user || !squadId || !idea)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const squad = await DeveloperSquad.findById(squadId);
    if (!squad)
      return res
        .status(404)
        .json({ success: false, message: "Squad not found" });

    squad.requests.push({
      writerId: user.writer?.writerId ?? user._id,
      writerName: user.name,
      idea,
      aiFlow: [], // start empty
      commits: [],
    });

    await squad.save();
    return res.status(200).json({ success: true, message: "Idea sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get squad details (requests included)
 * GET /api/developer/squad/:squadId
 */

export const markRequestDone = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { squadId, requestId } = req.body;
    if (!squadId || !requestId)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const squad = await DeveloperSquad.findById(squadId);
    if (!squad)
      return res
        .status(404)
        .json({ success: false, message: "Squad not found" });

    const reqDoc = squad.requests.id(requestId);
    if (!reqDoc)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    reqDoc.markAsDone = true;
    await squad.save();

    // optional: update Trello etc here

    return res.status(200).json({ success: true, message: "Marked done" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get preview metadata for editor viewer
 * GET /api/developer/preview/:previewId
 */
export const getPreviewMeta = async (req: Request, res: Response) => {
  try {
    const { previewId } = req.params;
    if (!previewId)
      return res
        .status(400)
        .json({ success: false, message: "previewId required" });

    // search for a request with previewId
    const squad = await DeveloperSquad.findOne(
      { "requests.previewId": previewId },
      { "requests.$": 1, name: 1 }
    );
    if (!squad || !squad.requests || squad.requests.length === 0)
      return res.status(404).json({ success: false, message: "Not found" });

    const reqDoc = (squad.requests as any)[0];
    console.log(reqDoc)
    return res.status(200).json({
      success: true,
      preview: {
        previewId,
        deployedPreviewUrl: reqDoc.deployedPreviewUrl,
        code: reqDoc.code,
        deployedAt: reqDoc.deployedAt,
        requestId: reqDoc._id,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Push work & deploy (create static preview on server)
 * POST /api/developer/push-work
 * body: { squadId, requestId, developerId, developerName, aiFlow, code? (string), commitMessage? }
 */
export const pushWorkAndDeploy = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      squadId,
      requestId,
      developerId,
      developerName,
      aiFlow,
      code,
      commitMessage,
    } = req.body;
    if (!squadId || !requestId || !aiFlow)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const squad = await DeveloperSquad.findById(squadId);
    if (!squad)
      return res
        .status(404)
        .json({ success: false, message: "Squad not found" });

    const reqDoc = squad.requests.id(requestId);
    if (!reqDoc)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    console.log("processing..")
    // processedFlow: write base64 images to files if present
    const processedFlow = JSON.parse(JSON.stringify(aiFlow));
    const previewId = crypto.randomBytes(8).toString("hex");
    const previewsRoot = path.join(process.cwd(), "previews");
    const previewDir = path.join(previewsRoot, previewId);
    await fs.mkdir(previewDir, { recursive: true });

    // scan scenes for base64 images and write them
    for (let i = 0; i < processedFlow.length; ++i) {
      const s = processedFlow[i];
      if (
        s.mediaUrl &&
        typeof s.mediaUrl === "string" &&
        s.mediaUrl.startsWith("data:image")
      ) {
        const match = s.mediaUrl.match(/^data:image\/(\w+);base64,(.*)$/);
        if (match) {
          const ext = match[1] === "svg+xml" ? "svg" : match[1];
          const base64 = match[2];
          const filename = `scene_${i}.${ext}`;
          await fs.writeFile(
            path.join(previewDir, filename),
            Buffer.from(base64, "base64")
          );
          s.mediaUrl = `/previews/${previewId}/${filename}`;
        }
      }
    }

    // if code provided use it, else generate simple HTML
    let finalCode = code;
    if (!finalCode) {
      // generate HTML from aiFlow
      const safeFlow = JSON.stringify(processedFlow).replace(/</g, "\\u003c");
      finalCode = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Preview</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body{ background:#0b0b0f;color:#fff;font-family:Inter,system-ui; padding:20px }
    .scene{ border:1px solid #333;padding:12px;margin-bottom:12px;border-radius:8px;background:#0f0f14}
    img{ max-width:100%; height:auto; display:block; margin-top:8px; }
    canvas{ background:#000; display:block; margin-top:8px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(commitMessage || "Preview")}</h1>
  <p>By: ${escapeHtml(developerName || "Unknown")}</p>
  <div id="container"></div>
  <button id="play">Play Timeline</button>
  <script>
    const flow = ${safeFlow};
    const container = document.getElementById('container');
    flow.forEach((s, idx) => {
      const div = document.createElement('div');
      div.className = 'scene';
      div.innerHTML = '<h3>' + (s.scene||('Scene '+(idx+1))) + '</h3><p>' + (s.description||'') + '</p>';
      if (s.mediaUrl) {
        const ext = s.mediaUrl.split('.').pop().toLowerCase();
        if (ext === 'mp4' || ext === 'webm') {
          div.innerHTML += '<video controls src="' + s.mediaUrl + '" style="max-width:100%;margin-top:8px"></video>';
        } else {
          div.innerHTML += '<img src="' + s.mediaUrl + '" />';
        }
      }
      if (s.drawing) {
        const canvas = document.createElement('canvas');
        canvas.width = 800; canvas.height = 450;
        div.appendChild(canvas);
        drawKonvaData(canvas, s.drawing);
      }
      container.appendChild(div);
    });

    function drawKonvaData(canvas, drawing) {
      if (!drawing) return;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.lineJoin='round'; ctx.lineCap='round';
      drawing.forEach(line => {
        const pts = line.points;
        if (!pts || pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i+1]);
        ctx.stroke();
      });
    }

    document.getElementById('play').addEventListener('click', async () => {
      for (let i=0;i<flow.length;i++) {
        const el = container.children[i];
        el.scrollIntoView({behavior:'smooth', block:'center'});
        await new Promise(r=>setTimeout(r, 1200));
      }
    });
  </script>
</body>
</html>
      `;
    }

    // write index.html
    await fs.writeFile(path.join(previewDir, "index.html"), finalCode, "utf-8");

    // update request doc
    reqDoc.markAsDone = true;
    reqDoc.deployedPreviewUrl = `${
      process.env.SERVER_ORIGIN || "http://localhost:4000"
    }/previews/${previewId}/index.html`;
    reqDoc.deployedAt = new Date();
    reqDoc.previewId = previewId;
    reqDoc.code = finalCode;
    reqDoc.assets = reqDoc.assets || [];
    // push commit
    if (!Array.isArray(reqDoc.commits)) {
      reqDoc.commits = [] as any;
    }

    reqDoc.commits.push({
      developerId: developerId || user?._id,
      developerName: developerName || user?.name || "Unknown",
      aiFlow: processedFlow,
      message: commitMessage || "deployed",
      timestamp: new Date(),
    });

    await squad.save();

    if (
      process.env.GITHUB_TOKEN &&
      process.env.GITHUB_REPO &&
      process.env.GITHUB_OWNER
    ) {
      try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = process.env.GITHUB_OWNER!;
        const repo = process.env.GITHUB_REPO!;
        const pathInRepo = `previews/${previewId}/index.html`;
        const contentBase64 = Buffer.from(finalCode, "utf8").toString("base64");
        
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: pathInRepo,
          message: `Add preview ${previewId}`,
          content: contentBase64,
        });
      } catch (ghErr) {
        console.warn("GitHub push failed (ignored):", ghErr.message || ghErr);
      }
    }
    if (
      process.env.TRELLO_KEY &&
      process.env.TRELLO_TOKEN &&
      process.env.TRELLO_BOARD_ID &&
      process.env.TRELLO_TODO_LIST_ID
    ) {
      try {
        const url = `https://api.trello.com/1/cards`;
        const params = {
          key: process.env.TRELLO_KEY,
          token: process.env.TRELLO_TOKEN,
          idList: process.env.TRELLO_TODO_LIST_ID,
          name: reqDoc.idea,
          desc: `Preview: ${reqDoc.deployedPreviewUrl}`,
        };
        const resp = await axios.post(url, null, { params });
        if (resp.data && resp.data.id) {
          reqDoc.trelloCardId = resp.data.id;
          await squad.save();
        }
      } catch (trErr) {
        console.warn(
          "Trello card creation failed (ignored):",
          trErr.message || trErr
        );
      }
    }

    return res.status(200).json({
      success: true,
      deployedUrl: reqDoc.deployedPreviewUrl,
      previewId,
    });
  } catch (err) {
    console.error("pushWorkAndDeploy error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: Request, res: Response) {
  try {
    const { prompt } = req.body;
    console.log("here");
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, message: "Prompt is required" });
    }

    const result = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    console.log(result)
    const arrayBuffer = await result.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;
    console.log(base64Image)
    res.status(200).json({ success: true, imageUrl: base64Image });
  } catch (error) {
    console.error("Error generating image:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
export const getPreviewById = async (req: Request, res: Response) => {
  try {
    const { previewId } = req.params;
    if (!previewId) return res.status(400).json({ success: false, message: "previewId required" });
    const squad = await DeveloperSquad.findOne({ "requests.previewId": previewId });
    if (!squad) return res.status(404).json({ success: false, message: "Preview not found" });
    const reqDoc = squad.requests.find((r: any) => r.previewId === previewId);
    if (!reqDoc) return res.status(404).json({ success: false, message: "Preview not found" });

    return res.status(200).json({ success: true, preview: reqDoc });
  } catch (err) {
    console.error("getPreviewById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
