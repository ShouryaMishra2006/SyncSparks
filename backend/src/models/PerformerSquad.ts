import mongoose, { Schema } from "mongoose";

const performerSquadSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },

    performers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    ideas: [
      {
        text: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        category: {
          type: String,
          enum: ["comedy", "serious", "other"],
          default: "other",
        },
      },
    ],
    aiSummary: {
      text: String,
      createdAt: Date,
    },
    aiExpansion: {
      text: String,
      createdAt: Date,
    },
    aiMindMap: {
      data: Schema.Types.Mixed,
      createdAt: Date,
    },
    invitationCode: {
      text: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PerformerSquad", performerSquadSchema);
