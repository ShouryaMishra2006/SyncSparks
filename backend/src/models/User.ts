import mongoose from "mongoose"

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
})

export default mongoose.model("User", userSchema)
