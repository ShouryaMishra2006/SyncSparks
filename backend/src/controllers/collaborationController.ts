import { Request, Response } from "express";
import CollaborationSession from "../models/CollaborationSession";
import mongoose from "mongoose";
import User from "../models/User";
import crypto from "crypto";

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

export const createSession = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Session name is required" });
    }

    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Generate a secure random invitation code (8 characters, alphanumeric)
    const invitationCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const session = new CollaborationSession({
      name,
      invitationCode,
      participants: [user._id],
      createdBy: user._id,
      canvasData: {},
    });

    await session.save();
    await User.findByIdAndUpdate(user._id, {
      $push: { collaborationSessions: session._id },
    });

    return res.status(201).json(session);
  } catch (err) {
    console.error("Create session error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessions = await CollaborationSession.find({
      participants: user._id,
    }).populate("participants", "_id name nickname email");

    return res.json(sessions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const joinSession = async (req: Request, res: Response) => {
  try {
    const { invitationCode } = req.body;
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!invitationCode) {
      return res.status(400).json({ message: "Invitation code required" });
    }

    const session = await CollaborationSession.findOne({
      invitationCode: invitationCode,
    });

    if (!session) {
      return res.status(404).json({ message: "Invalid invitation code" });
    }

    const userIdString = user._id.toString();
    const hasJoined = session.participants.some(
      (p) => p.toString() === userIdString
    );

    if (hasJoined) {
      return res.status(200).json({ message: "Already joined", session });
    }

    session.participants.push(new mongoose.Types.ObjectId(user._id));
    await session.save();

    return res.status(200).json({ message: "Joined successfully", session });
  } catch (err) {
    console.error("Join session error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSessionDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await CollaborationSession.findById(id).populate(
      "participants",
      "name nickname email"
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is a participant
    const userId = user._id.toString();
    const isParticipant = session.participants.some(
      (p: any) => p._id.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json(session);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
//TODO:
//in this first save to an in memory db (like memcached)
//and then after exiting, or maybe every 1 minute, store it in the db
export const saveCanvasData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { canvasData } = req.body;
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await CollaborationSession.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is a participant
    const userId = user._id.toString();
    const isParticipant = session.participants.some(
      (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    session.canvasData = canvasData;
    await session.save();

    return res.json({ message: "Canvas data saved successfully" });
  } catch (err) {
    console.error("Save canvas error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getCanvasData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await CollaborationSession.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is a participant
    const userId = user._id.toString();
    const isParticipant = session.participants.some(
      (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ canvasData: session.canvasData || {} });
  } catch (err) {
    console.error("Get canvas error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const leaveSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await CollaborationSession.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Remove user from participants
    const userId = user._id.toString();
    session.participants = session.participants.filter(
      (p: any) => p.toString() !== userId
    );

    await session.save();

    return res.json({ message: "Left session successfully" });
  } catch (err) {
    console.error("Leave session error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getConnectedUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await CollaborationSession.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is a participant
    const userId = user._id.toString();
    const isParticipant = session.participants.some(
      (p: any) => p.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Import the function from index.ts to get connected users
    const { getConnectedUsers: getConnectedUsersFromWS } = await import(
      "../index.js"
    );
    const connectedUsers = getConnectedUsersFromWS(id);

    return res.json({ connectedUsers });
  } catch (err) {
    console.error("Get connected users error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
