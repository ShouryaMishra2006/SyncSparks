import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import DeveloperSquad from "../models/DeveloperSquad";
import User from "../models/User";

export const createDeveloperSquad = async (req: Request, res: Response) => {
  try {
    const { name, description, password } = req.body;
    const user = (req as any).user;
    console.log("me user:",user)
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
      return res.status(404).json({ success: false, message: "Developer not found." });
    }

    if (!developerUser.developer) {
      developerUser.developer = { squadsJoined: [], requestsReceived: [] } as any;
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
      return res.status(400).json({ success: false, message: "Invite code and password are required." });
    }

    const squad = await DeveloperSquad.findOne({ inviteCode });
    if (!squad) {
      return res.status(404).json({ success: false, message: "Squad not found." });
    }
    const isPasswordCorrect = await bcrypt.compare(password, squad.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    const isAlreadyJoined = squad.developers.some(
      (id) => id.toString() === user._id
    );
    if (isAlreadyJoined) {
      return res.status(400).json({ success: false, message: "You have already joined this squad." });
    }

    squad.developers.push(user._id);
    await squad.save();

    const developerUser = await User.findById(user._id);
    if (!developerUser) {
      return res.status(404).json({ success: false, message: "Developer not found." });
    }

    if (!developerUser.developer) {
      developerUser.developer = { squadsJoined: [], requestsReceived: [] } as any;
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
      return res.status(400).json({ success: false, message: "Squad ID is required" });
    }
    const squad = await DeveloperSquad.findById(squadId).populate("developers", "name email");
    if (!squad) {
      return res.status(404).json({ success: false, message: "Squad not found" });
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
export const searchDeveloperSquadByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ success: false, message: "Invite code is required" });
    }

    const squad = await DeveloperSquad.findOne({ inviteCode: code }).select("_id name inviteCode");
    if (!squad) {
      return res.status(404).json({ success: false, message: "Squad not found" });
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
      return res.status(400).json({ success: false, message: "Squad ID and idea are required" });
    }

    const squad = await DeveloperSquad.findById(squadId);
    console.log("send to :",squad)
    if (!squad) {
      return res.status(404).json({ success: false, message: "Squad not found" });
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

    return res.status(200).json({ success: true, message: "Idea sent to developer squad" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
