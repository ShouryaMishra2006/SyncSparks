import { Request, Response } from "express";
import PerformerSquad from "../models/PerformerSquad";
import mongoose from "mongoose";
import User from "../models/User";
interface AuthUser {
  _id: string; 
  name: string;
  email: string;
  isVerified: boolean;
}

export const createSquad = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Squad name is required" });
    }
    const performer= req.user as AuthUser;

    if (!performer) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const squad = new PerformerSquad({
      name,
      description,
      performers: [performer._id],
      aiSummarized: "",
      aiExpanded: "",
      mindMap: "",
    });
    console.log("updated squad :",squad)
    await squad.save();
    await User.findByIdAndUpdate(performer._id, {
      $push: { "performer.squadsJoined": squad._id },
    });
    return res.status(201).json(squad);
  } catch (err) {
    console.error("Create squad error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSquads = async (req: Request, res: Response) => {
  try {
    const squads = await PerformerSquad.find().populate("performers", "name nickname email");
    return res.json(squads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const joinSquad = async (req: Request, res: Response) => {
  try {
    const { squadId } = req.body;
    const performer = req.user as AuthUser;

    if (!performer) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const squad = await PerformerSquad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }
    const performerId = performer._id.toString();
    const hasJoined = squad.performers.some(p => p.toString() === performerId);
    if (hasJoined) {
      console.log("checked")
      return res.status(200).json({ message: "Already joined", squad });
    }
    squad.performers.push(new mongoose.Types.ObjectId(performer._id));
    await squad.save();
    await User.findByIdAndUpdate(performer._id, {
      $addToSet: { "performer.squadsJoined": squad._id },
    });

    return res.status(200).json({ message: "Joined successfully", squad });
  } catch (err) {
    console.error("Join squad error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};