import { Request, Response } from "express";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import PerformerSquad from "../models/PerformerSquad";
import {extractKeywords} from "../utils/extractKeywords"

/**
 * POST /api/ai/mindmap/:squadId
 * Body: { count: number }
 *
 * Returns:
 * { nodes: [{ id, text, explanation }], edges: [{ source: number, target: number }], raw: string }
 */
export const generateMindMapBySquad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { count } = req.body;
     console.log("request params for maindmap: ", req.params);
    if (!id) return res.status(400).json({ message: "squadId required" });
    const n = Number(count || 5);
    if (Number.isNaN(n) || n <= 0) return res.status(400).json({ message: "count must be positive" });

    const squad = await PerformerSquad.findById(id);
    if (!squad) return res.status(404).json({ message: "Squad not found" });

    // ASSUMPTION: PerformerSquad has an `ideas` field which is an array of { text, author, createdAt }
    const allIdeas = Array.isArray(squad.ideas) ? squad.ideas : [];
    const lastIdeas = allIdeas
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, n)
      .reverse(); // reverse so older -> newer

    if (lastIdeas.length === 0) {
      return res.status(400).json({ message: "No ideas in squad" });
    }

    console.log(lastIdeas);
    const keywords = extractKeywords(lastIdeas, 25);
    console.log("Extracted Keywords:", keywords);


    // Build prompt that requests strict JSON
    const promptText = `
You are an assistant that MUST output valid JSON only. Given the following ideas (text + author) produce a mind map describing the workflow formed by these ideas.

Return JSON object with:
- "nodeExplanations": array of objects { "text": "<label (3-6 words)>", "explanation": "<1-2 sentence note>" }
- "edges": array of objects { "source": <node index 0-based>, "target": <node index> }

Rules:
- Produce 4..20 nodes representing distinct steps/concepts derived from the ideas.
- Labels short (3-6 words). Explanations 1-2 sentences.
- Edges must refer to node indices (0-based).
- Respond ONLY with valid JSON and nothing else.
Ideas:
${lastIdeas.map((it: any, i: number) => `${i + 1}. (${it.author || "Anon"}) ${it.text}`).join("\n\n")}
Extracted Keywords:
${keywords.join(", ")}
`.trim();

    const llm = new ChatGoogleGenerativeAI({
      model: "models/gemini-2.0-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.2,
    });

    const prompt = new PromptTemplate({ template: "{input}", inputVariables: ["input"] });
    const finalPrompt = await prompt.format({ input: promptText });
    const response = await llm.invoke(finalPrompt);
  console.log("prompt response:", response)
    // extract response text
    let rawText = "";
    if (typeof response.content === "string") rawText = response.content;
    else if (Array.isArray(response.content)) rawText = response.content.map((p: any) => (typeof p === "string" ? p : p?.text || "")).join(" ");
    else rawText = String(response.content ?? "");

    // Try to parse JSON strictly
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // fallback: try to find JSON substring
      try {
        const s = rawText.indexOf("{");
        const eI = rawText.lastIndexOf("}");
        if (s !== -1 && eI !== -1) {
          parsed = JSON.parse(rawText.slice(s, eI + 1));
        }
      } catch (err) {
        parsed = null;
      }
    }

    if (!parsed || !Array.isArray(parsed.nodeExplanations)) {
      // fallback: create nodes from ideas
      const fallbackNodes = lastIdeas.map((it: any, idx: number) => ({
        id: `ai-node-${idx}`,
        text: (it.text || "").slice(0, 60),
        explanation: it.text || "",
      }));
      const fallbackEdges: { source: number; target: number }[] = [];
      // linear chain fallback
      for (let i = 0; i + 1 < fallbackNodes.length; i++) fallbackEdges.push({ source: i, target: i + 1 });

      // Save fallback to squad.aiMindMap
      squad.aiMindMap = { data: { nodes: fallbackNodes, edges: fallbackEdges }, createdAt: new Date() };
      await squad.save();

      return res.status(200).json({ nodes: fallbackNodes, edges: fallbackEdges, raw: rawText });
    }

    // Normalize parsed nodes & edges
    const nodes = (parsed.nodeExplanations || []).map((ne: any, idx: number) => ({
      id: `ai-node-${idx}`,
      text: ne.text || `Node ${idx + 1}`,
      explanation: ne.explanation || "",
      color: (ne.color || "blue"), // optional: allow LLM to set color
    }));
    console.log("nodes:", nodes);

    const edges = (parsed.edges || []).map((ed: any) => ({
      source: Number(ed.source),
      target: Number(ed.target),
    }));
    console.log("edges:", edges)

    // Save to squad
    squad.aiMindMap = { data: { nodes, edges }, createdAt: new Date() };
    await squad.save();
    res.setHeader("Content-Type", "application/json");

    return res.status(200).json({ nodes, edges, raw: rawText });
  } catch (err) {
    console.error("generateMindMapBySquad error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
