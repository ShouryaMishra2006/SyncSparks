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
export const getSquadDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid squad ID" });
    }
    const squad = await PerformerSquad.findById(id)
      .populate("performers", "name nickname email") 
      .populate("ideas.createdBy", "name nickname email");

    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    return res.status(200).json(squad);
  } catch (err) {
    console.error("Get Squad Details Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const addIdea = async (req: Request, res: Response) => {
  try {
    const { squadId } = req.params;
    const { text} = req.body; 
    const performer = req.user as AuthUser; 

    if (!performer) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Idea text is required" });
    }
    const user = await User.findById(performer._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const squad = await PerformerSquad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }
    const newIdea = {
      text,
      createdBy: performer._id,
      createdAt: new Date()
    };
    squad.ideas.push(newIdea as any);
    await squad.save();
    if (!user.performer) user.performer = { squadsJoined: [], ideas: [] };
    user.performer.ideas.push(text);
    await user.save();
    const populatedIdea = await PerformerSquad.findOne(
      { _id: squadId, "ideas._id": squad.ideas[squad.ideas.length - 1]._id },
      { "ideas.$": 1 }
    ).populate("ideas.createdBy", "name nickname");

    return res.status(201).json(populatedIdea?.ideas[0]);
  } catch (err) {
    console.error("Error adding idea:", err);
    return res.status(500).json({ message: "Server error" });
  }
};