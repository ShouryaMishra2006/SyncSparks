import mongoose, { Schema } from "mongoose";

const collaborationSessionSchema = new Schema(
  {
    name: { type: String, required: true },
    invitationCode: { type: String, required: true, unique: true },

    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Canvas elements stored as Y.js state
    canvasData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "CollaborationSession",
  collaborationSessionSchema
);
