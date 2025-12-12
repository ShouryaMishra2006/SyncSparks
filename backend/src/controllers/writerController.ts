import { Request, Response } from "express";
import User from "../models/User";
import crypto from "crypto";
import { genreClassifier } from "../utils/genreClassifier";

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
}
export const assignWriterId = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    const userId = user?._id;
    console.log(user);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const writerId = `WRT-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          role: "writer",
          writer: {
            writerId,
            ideaInbox: [],
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Writer ID assigned successfully!",
      writerId: updatedUser.writer?.writerId,
    });
  } catch (error) {
    console.error("Error assigning writer ID:", error);
    res.status(500).json({ error: "Failed to assign writer ID" });
  }
};
export const fetchWriters = async (req: Request, res: Response) => {
  try {
    console.log("on mission to fetch writers hehe");
    const writers = await User.find({
      "writer.writerId": { $exists: true, $ne: null },
    }).select("_id name nickname writer");
    console.log("writers:", writers);
    res.status(200).json(writers);
  } catch (error) {
    console.error("Error fetching writers:", error);
    res.status(500).json({ message: "Failed to fetch writers" });
  }
};
// const payload = {
//       writerId:writerId,
//       aiResult: {
//         title: aiResult.title,
//         text: aiResult.text,
//         bullets: aiResult.bullets,
//       },
//     };
export const addIdeaInbox = async (req: Request, res: Response) => {
  try {
    const { writerId, aiResult } = req.body;

    if (!writerId || !aiResult?.text) {
      return res.status(400).json({
        success: false,
        message: "Writer ID and AI result are required.",
      });
    }
    const result = await genreClassifier(aiResult); // 🎯 Auto classify here
    const genre = result.genre;
    console.log("genre", genre);
    const writerUser = await User.findOne({ "writer.writerId": writerId });
    if (!writerUser) {
      return res.status(404).json({
        success: false,
        message: "Writer not found.",
      });
    }
    const performer = (req as any).user;
    if (!performer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — performer not found.",
      });
    }
    console.log(aiResult.text);

    const newIdea = {
      performerName: performer.name,
      performerId: performer._id,
      idea: aiResult.text,
      submittedAt: new Date(),
      genre,
    };
    writerUser.writer?.ideaInbox.push(newIdea);
    console.log("writer user", writerUser);
    await writerUser.save();

    return res.status(200).json({
      success: true,
      message: "AI result shared successfully.",
      writer: {
        name: writerUser.name,
        writerId: writerUser.writer?.writerId,
      },
    });
  } catch (e) {
    console.error("Error in addIdeaInbox:", e);
    return res.status(500).json({
      success: false,
      message: "Server error while sharing idea.",
    });
  }
};
export const removeIdea = async (req: Request, res: Response) => {
  try {
    const { writerId, submittedAt } = req.body;

    if (!writerId || !submittedAt) {
      return res.status(400).json({
        success: false,
        message: "Writer ID and submittedAt are required.",
      });
    }
    await User.updateOne(
      { "writer.writerId": writerId },
      { $pull: { "writer.ideaInbox": { submittedAt: new Date(submittedAt) } } }
    );

    return res.status(200).json({
      success: true,
      message: "Idea removed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const updatelocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ error: "Latitude & longitude required" });
    }
    const user = req.user as AuthUser;
    const userId = user?._id;
    await User.findByIdAndUpdate(userId, {
      "writer.location": {
        type: "Point",
        coordinates: [lng, lat],
      },
    });
    res.status(200).json({ message: "Location updated successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};
export const getNearbyWriters = async (req: Request, res: Response) => {
  try {
    const { lat, lng, r } = req.query;

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radius = parseFloat(r as string);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
      return res
        .status(400)
        .json({ message: "lat, lng, and r must be numbers" });
    }

    const radiusInMeters = radius * 1000;
    console.log("going to process")
    const writers = await User.find({
      "writer.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInMeters,
        },
      },
    });

    return res.json(Array.isArray(writers) ? writers : []);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};
