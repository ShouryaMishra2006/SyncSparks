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

    const promptText = `
You are a creative summarizer. Given the following ideas (text + author), produce:
1) A concise 3-4 sentence summary capturing the core themes.
2) 5 short bullet action-items or highlights extracted from ideas.
3) 1 suggested title for the summarized idea.

Return JSON with keys:
- "title"
- "summary"
- "bullets" (array of strings)

Ideas:
${ideas
  .map((it: any, idx: number) => `${idx + 1}. (${it.author || "Anon"}) ${it.text}`)
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
    if (typeof response.content === "string") rawText = response.content;
    else if (Array.isArray(response.content))
      rawText = response.content.map((p: any) => (typeof p === "string" ? p : p?.text || "")).join(" ");
    else rawText = String(response.content ?? "");

    // try parse json portion
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

    // Optional: attach to squad if id provided
    if (id) {
      const squad = await PerformerSquad.findById(id);
      if (squad) {
        squad.aiSummary = { text: summaryObj.text, createdAt: summaryObj.createdAt };
        await squad.save();
      }
    }

    return res.status(200).json({ message: "Summarized successfully", summary: summaryObj });
  } catch (err) {
    console.error("Error in summarizing ideas:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
