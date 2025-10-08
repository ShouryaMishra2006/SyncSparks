import { Request, Response } from "express";
import PerformerSquad from "../models/PerformerSquad";
import mongoose from "mongoose";
import { PipelineStage } from "mongoose";
import User from "../models/User";
import crypto from "crypto";

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

export const createSquad = async (req: Request, res: Response) => {
  try {
    const { name, description, public: isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Squad name is required" });
    }
    const performer = req.user as AuthUser;

    if (!performer) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let invitationCode = null;
    if (!isPublic) {
      // Generate a secure random invitation code for PRIVATE squads (8 characters, alphanumeric)
      invitationCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    }

    const squad = new PerformerSquad({
      name,
      description,
      performers: [performer._id],
      aiSummarized: "",
      aiExpanded: "",
      mindMap: "",
      invitationCode: invitationCode ? { text: invitationCode } : undefined,
    });
    console.log("updated squad :", squad);
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
    // Only return public squads (squads without invitation codes)
    const squads = await PerformerSquad.find().populate("performers", "_id name nickname email");
    return res.json(squads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const joinSquad = async (req: Request, res: Response) => {
  try {
    const { squadId, invitationCode } = req.body;
    const performer = req.user as AuthUser;

    if (!performer) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let squad;

    // If only invitation code is provided, find squad by code
    if (!squadId && invitationCode) {
      squad = await PerformerSquad.findOne({
        "invitationCode.text": invitationCode,
      });

      if (!squad) {
        return res.status(404).json({ message: "Invalid invitation code" });
      }
    } else if (squadId) {
      squad = await PerformerSquad.findById(squadId);

      if (!squad) {
        return res.status(404).json({ message: "Squad not found" });
      }

      // Check if squad requires invitation code
      if (squad.invitationCode && squad.invitationCode.text) {
        if (!invitationCode) {
          return res.status(400).json({
            message: "Invitation code required for this private squad",
          });
        }
        if (invitationCode !== squad.invitationCode.text) {
          return res.status(403).json({ message: "Invalid invitation code" });
        }
      }
    } else {
      return res
        .status(400)
        .json({ message: "Squad ID or invitation code required" });
    }

    const performerId = performer._id.toString();
    const hasJoined = squad.performers.some(
      (p) => p.toString() === performerId
    );
    if (hasJoined) {
      console.log("checked");
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
    const { text } = req.body;
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
      createdAt: new Date(),
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
interface SearchIdeasQuery {
  q?: string;
  startDate?: string;
  endDate?: string;
}

export const searchIdeas = async (
  req: Request<{}, {}, {}, SearchIdeasQuery>,
  res: Response
) => {
  try {
    const {  startDate, endDate } = req.query;
    const q = req.query.q?.trim();

    console.log("query:",q)
    const matchConditions: any[] = [];
    if (q) {
      matchConditions.push({
        "ideas.text": { $regex: q, $options: "i" },
      });
    }
    if (startDate && endDate) {
      matchConditions.push({
        "ideas.createdAt": {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });
    }
    console.log("match with:",matchConditions)
    const pipeline: PipelineStage[] = [];
    pipeline.push({ $unwind: "$ideas" });
    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $and: matchConditions } });
    }
    pipeline.push({
      $project: {
        _id: 0,
        squadId: "$_id",
        name: 1,
        ideaText: "$ideas.text",
        createdBy: "$ideas.createdBy",
        createdAt: "$ideas.createdAt",
        category: "$ideas.category",
      },
    });

    pipeline.push({ $sort: { createdAt: -1 } });
    console.log("pipeline:",pipeline)
    const ideas = await PerformerSquad.aggregate(pipeline);

    res.status(200).json({ ideas });
  } catch (error) {
    console.error("Error searching ideas:", error);
    res.status(500).json({ message: "Error searching ideas" });
  }
};
// type Writer = {
//   _id: string;
//   name: string;
//   nickname?: string;
//   writer?: {
//     writerId: string;
//     ideaInbox: any[];
//     _id: string;
//   };
// };

export const searchWriter = async (req: Request, res: Response) => {
  try {
    console.log("Searching writer");
    const { writerid } = req.query;

    if (!writerid) {
      return res.status(400).json({ message: "Writer ID is required" });
    }
    const writerDoc = await User.findOne({ "writer.writerId": writerid })
      .select("_id name nickname writer")  

    if (!writerDoc) {
      return res.status(404).json({ message: "Writer not found" });
    }
    console.log(" Writer found:", writerDoc);

    res.status(200).json({ writer: writerDoc });
  } catch (error) {
    console.error("Error searching writer:", error);
    res.status(500).json({ message: "Error searching writer" });
  }
};