import mongoose from "mongoose"

const performerExtensionSchema = new mongoose.Schema({
  squadsJoined: [
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "PerformerSquad",
    },
  ],
  ideas: [
    {
      type: String, 
    },
  ],
})
const writerExtensionSchema = new mongoose.Schema({
  writerId: {
    type: String,
    unique: true,
    sparse: true, //allows some users not to have it
  },
  ideaInbox: [
    {
      performerName: {
        type: String,
        required: true,
      },
      performerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      idea: {
        type: String,
        required: true,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});
const developerExtensionSchema = new mongoose.Schema({
  squadsJoined: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeveloperSquad", 
    },
  ],
});

const userSchema = new mongoose.Schema({
  name: String,
  nickname: String,
  email: { type: String, unique: true },
  passwordHash: String,
  googleId: String,
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ["performer", "writer", "developer"] },
  otp: {
    code: String,
    expiresAt: Date,
  },
  performer: performerExtensionSchema,
  writer: writerExtensionSchema,
  developer: developerExtensionSchema,
})
userSchema.index({ "writer.writerId": 1 }, { unique: true, sparse: true });
export default mongoose.model("User", userSchema)
