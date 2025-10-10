import mongoose from "mongoose";

const developerSquadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    developers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    inviteCode: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requests: [
      {
        writerId: {
          type: String, 
          required: true
        },
        writerName: { type: String, required: true },
        idea: { type: String, required: true },
        aiFlow: [
          {
            scene: { type: String, required: false },
            description: { type: String, required: false },
          },
        ],
        submittedAt: { type: Date, default: Date.now },
        markAsDone: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

developerSquadSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("DeveloperSquad", developerSquadSchema);
