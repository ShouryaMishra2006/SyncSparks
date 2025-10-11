import mongoose from "mongoose";

const sceneSchema = new mongoose.Schema({
  scene: String,
  description: String,
  mediaUrl: String,    // stored URL (cloud or /previews/..)
  drawing: { type: mongoose.Schema.Types.Mixed }, // Konva lines data
});

const commitSchema = new mongoose.Schema({
  developerId: String,
  developerName: String,
  aiFlow: [sceneSchema],
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const requestSchema = new mongoose.Schema({
  writerId: { type: String, required: true }, // keep string to support custom ids like "WRT-..."
  writerName: { type: String, required: true },
  idea: { type: String, required: true },
  aiFlow: [sceneSchema],
  commits: [commitSchema],
  submittedAt: { type: Date, default: Date.now },
  markAsDone: { type: Boolean, default: false },
  trelloCardId: String,
  deployedPreviewUrl: String,
  deployedAt: Date,
  previewId: String, // local previews/<previewId>
  code: String, // stored code snapshot (index.html or project)
  assets: [String], // URLs
});

const developerSquadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  password: String, 
  inviteCode: { type: String, required: true, index: true, unique: true },
  developers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  requests: [requestSchema],
}, { timestamps: true });

export default mongoose.model("DeveloperSquad", developerSquadSchema);
