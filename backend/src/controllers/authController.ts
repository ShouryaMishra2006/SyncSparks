import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { sendOtpEmail } from "../utils/email";
import { generateOtp } from "../utils/otp";

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, nickname, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const { otp, expiresAt } = generateOtp();

    console.log(otp);
    console.log(expiresAt);
    const user = new User({
      name,
      nickname,
      email,
      passwordHash: hashed,
      isVerified: false,
      otp: { code: otp, expiresAt },
    });

    await user.save();
    await sendOtpEmail(email, otp);

    res.json({ message: "Signup successful. OTP sent to email." });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.isVerified) return res.json({ message: "Already verified" });

  if (
    !user.otp ||
    user.otp.code !== otp ||
    !user.otp.expiresAt ||
    user.otp.expiresAt.getTime() < Date.now()
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = undefined;
  await user.save();

  res.json({ message: "Email verified! You can now login." });
};

export const login = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });
  if (!user.isVerified)
    return res.status(400).json({ message: "Please verify your email first" });

  if (!user.passwordHash) {
    return res
      .status(400)
      .json({ message: "Password not set for this account" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60, 
  });

  res.json({ message: "Login successful", redirectUrl: `/dashboard/${role}` });
};

export const googleCallback = async (req: any, res: Response) => {
  try {
    const state = req.query.state ? JSON.parse(req.query.state as string) : {};
    const role = state.role || req.user.user.role || "performer";

    const token = jwt.sign(
      { id: req.user.user._id, email: req.user.user.email, role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.redirect(`http://localhost:3000/dashboard/${role}`);
  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect("http://localhost:3000/login?error=OAuthFailed");
  }
};
