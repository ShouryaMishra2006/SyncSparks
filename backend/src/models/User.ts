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
const userSchema = new mongoose.Schema({
  name: String,
  nickname: String,
  email: { type: String, unique: true },
  passwordHash: String,
  googleId: String,
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ["performer", "writer", "director", "developer"] },
  otp: {
    code: String,
    expiresAt: Date,
  },
  performer: performerExtensionSchema,
})

export default mongoose.model("User", userSchema)
