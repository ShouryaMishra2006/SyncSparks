import { Request, Response } from "express";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import PerformerSquad from "../models/PerformerSquad";

export const summarizeIdeas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // optional squad id
    const { ideas } = req.body;
    const performer = (req as any).user;

    if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
      return res.status(400).json({ message: "Ideas are required" });
    }

    const squad = await PerformerSquad.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    console.log("Received ideas:", ideas);
    const formattedIdeas = ideas
      .map((it: any, idx: number) => {
        const author = it?.author || "Anonymous";
        const text = it?.text || it || "";
        return `${idx + 1}. (${author}) ${text}`;
      })
      .join("\n\n");
    const promptText = `
You are a creative summarizer AI.

Given the following list of ideas, each optionally tagged with an author,
write a short summary capturing the overall message.

Then provide:
1. A concise 3-4 sentence summary capturing the main insights.
2. 5 actionable or highlight bullet points.
3. A short, catchy title for the set of ideas.

Return valid JSON with the following keys:
{
  "title": string,
  "summary": string,
  "bullets": string[]
}

Ideas:
${formattedIdeas}
`;

    const llm = new ChatGoogleGenerativeAI({
      model: "models/gemini-2.0-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
    });

    const prompt = new PromptTemplate({
      template: "{input}",
      inputVariables: ["input"],
    });

    const finalPrompt = await prompt.format({ input: promptText });
    const response = await llm.invoke(finalPrompt);
    let rawText = "";
    if (typeof response.content === "string") {
      rawText = response.content;
    } else if (Array.isArray(response.content)) {
      rawText = response.content
        .map((part: any) => (typeof part === "string" ? part : part?.text || ""))
        .join(" ")
        .trim();
    } else {
      rawText = String(response.content ?? "");
    }

    console.log(" Gemini rawText:", rawText);
    let parsed: any = null;
    try {
      const jsonStart = rawText.indexOf("{");
      const jsonEnd = rawText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const candidate = rawText.slice(jsonStart, jsonEnd + 1);
        parsed = JSON.parse(candidate);
      }
    } catch (e) {
      console.error("JSON parse error:", e);
    }

    const summaryObj = parsed
      ? {
          title: parsed.title ?? "",
          text: parsed.summary ?? rawText,
          bullets: parsed.bullets ?? [],
          raw: rawText,
          createdAt: new Date(),
          createdBy: performer?._id,
        }
      : {
          title: "",
          text: rawText,
          bullets: [],
          raw: rawText,
          createdAt: new Date(),
          createdBy: performer?._id,
        };
    squad.aiSummary = {
      text: summaryObj.text,
      createdAt: summaryObj.createdAt,
    };
    squad.aiExpansion ??= { text: "", createdAt: undefined };
    squad.aiMindMap ??= { data: null, createdAt: undefined };

    await squad.save();
    console.log(summaryObj)
    return res.status(200).json({
      message: "Summarized successfully",
      summary: summaryObj,
    });
  } catch (err) {
    console.error("Error in summarizing ideas:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const expandIdeaWithAI = async (req: Request, res: Response) => {
  try {
    const { idea } = req.body; 
    //const performer = (req as any).user;

    if (!idea.idea) {
      return res.status(400).json({
        success: false,
        message: "idea are required",
      });
    }
    console.log("frontend requested this idea:",idea.idea);
    const promptText = `
You are a creative AI writer assistant.

Given the following idea, expand it into a story-like sequence of 2-4 scenes.
Each scene should have a 'scene' name and a 'description' expanding on the idea creatively.
Add your own ideas also in the specified format.
Return valid JSON as an array like this:
[
  { "scene": "Scene 1", "description": "..." },
  { "scene": "Scene 2", "description": "..." }
]

Idea: ${idea.idea}
`;

    const llm = new ChatGoogleGenerativeAI({
      model: "models/gemini-2.0-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.5,
    });

    const prompt = new PromptTemplate({
      template: "{input}",
      inputVariables: ["input"],
    });

    const finalPrompt = await prompt.format({ input: promptText });
    const response = await llm.invoke(finalPrompt);
    console.log("response from ai:",response.content)
    let rawText = "";
    if (typeof response.content === "string") {
      rawText = response.content;
    } else if (Array.isArray(response.content)) {
      rawText = response.content
        .map((part: any) => (typeof part === "string" ? part : part?.text || ""))
        .join(" ")
        .trim();
    } else {
      rawText = String(response.content ?? "");
    }

    let aiScenes: any[] = [];
    try {
      const jsonStart = rawText.indexOf("[");
      const jsonEnd = rawText.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const candidate = rawText.slice(jsonStart, jsonEnd + 1);
        aiScenes = JSON.parse(candidate);
      }
    } catch (e) {
      console.error("Error parsing AI JSON:", e);
    }


    return res.status(200).json({
      success: true,
      message: "Idea expanded successfully",
      aiFlow: aiScenes,
      raw: rawText,
    });
  } catch (err) {
    console.error("Error in AI expansion:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};