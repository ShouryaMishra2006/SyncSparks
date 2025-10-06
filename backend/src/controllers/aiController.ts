import { Request, Response } from "express";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import PerformerSquad from "../models/PerformerSquad";
import User from "../models/User";

export const summarizeIdeas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ideas } = req.body;
    const performer = (req as any).user; // requireAuth attaches user

    if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
      return res.status(400).json({ message: "Ideas are required" });
    }

    const squad = await PerformerSquad.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    console.log("squad from param squad id:", squad);

    const promptText = `
You are a creative summarizer. Given the following ideas (text + author), produce:
1) A concise 3-4 sentence summary capturing the core themes.
2) 5 short bullet action-items or highlights extracted from ideas.
3) 1 suggested title for the summarized idea.

Return JSON with keys: "title", "summary", and "bullets" (array of strings).

Ideas:
${ideas
  .map(
    (it: any, idx: number) => `${idx + 1}. (${it.author || "Anon"}) ${it.text}`
  )
  .join("\n\n")}
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
        .map((part: any) =>
          typeof part === "string" ? part : part?.text || ""
        )
        .join(" ")
        .trim();
    } else {
      rawText = String(response.content ?? "");
    }

    console.log("Gemini summarized this as rawText:", rawText);

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
          createdBy: performer._id,
        }
      : {
          title: "",
          text: rawText,
          bullets: [],
          raw: rawText,
          createdAt: new Date(),
          createdBy: performer._id,
        };
    squad.aiSummary = {
      text: summaryObj.text,
      createdAt: summaryObj.createdAt,
    };
    squad.aiExpansion = squad.aiExpansion ?? { text: "", createdAt: undefined };
    squad.aiMindMap = squad.aiMindMap ?? { data: null, createdAt: undefined };

    await squad.save();

    return res.status(200).json({
      message: "Summarized successfully",
      summary: summaryObj,
    });
  } catch (err) {
    console.error("Error in summarizing ideas:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
