import { removeStopwords } from "stopword";

type IdeaLike = string | { text?: string | null };

const singularize = (token: string) => {
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ses") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 3) return token.slice(0, -1);
  return token;
};

const stem = (token: string) =>
  token
    .replace(/(ingly|edly)$/g, "")
    .replace(/(ing|ed|ly)$/g, "")
    .replace(/(ment|ness|tion|ions)$/g, "");

/**
 * Extract meaningful keywords from ideas.
 * Accepts string[] or array of objects with `.text`.
 */
export function extractKeywords(ideas: IdeaLike[], maxKeywords = 30): string[] {
  if (!Array.isArray(ideas) || ideas.length === 0) return [];

  // --- 1. Normalize input (extract raw text)
  const texts: string[] = ideas
    .map((it) => (typeof it === "string" ? it : (it && it.text) || ""))
    .map((t) => String(t || "").trim())
    .filter(Boolean);

  if (texts.length === 0) return [];

  // --- 2. Custom stopwords (augment default stopword list for better signal)
  const extraStopwords = [
    "also",
    "would",
    "could",
    "please",
    "thanks",
    "thank",
    "hey",
    "hi",
    "amp",
    "get",
    "using",
    "use",
  ];

  // --- 3. Clean, tokenize, remove stopwords, singularize tokens, stem tokens
  // We'll maintain a mapping stem -> original token counts to return clean surface tokens later.
  const docsStemmed: string[][] = [];
  const stemToOriginalFreq: Record<string, Record<string, number>> = {};

  for (const raw of texts) {
    // basic cleaning: remove URLs, emails, punctuation; keep alphanum & spaces
    const cleaned = raw
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\S+@\S+/g, " ")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const tokens = cleaned.split(/\s+/).filter(Boolean);
    console.log("tokens from tokenizerin mindmap", tokens)

    const filtered = removeStopwords(tokens, extraStopwords).filter(
      (t) => t.length > 1 && !/^\d+$/.test(t)
    );

    // singularize (better merging of plurals), then stem for TF-IDF calculation
    const normalized = filtered.map((tok) => singularize(tok));
    console.log('filtered after stopwords', normalized)

    const stemmed = normalized.map((tok) => stem(tok));
    console.log(stemmed)

    // record mapping stem -> original token frequencies
    normalized.forEach((orig:any, i:any) => {
      const s = stemmed[i];
      if (!stemToOriginalFreq[s]) stemToOriginalFreq[s] = {};
      stemToOriginalFreq[s][orig] = (stemToOriginalFreq[s][orig] || 0) + 1;
    });

    docsStemmed.push(stemmed);
  }
  

  // --- 4. Compute a lightweight TF-IDF score over stemmed terms.
  const documentFrequency: Record<string, number> = {};
  for (const doc of docsStemmed) {
    new Set(doc).forEach((term) => {
      documentFrequency[term] = (documentFrequency[term] || 0) + 1;
    });
  }

  const aggScores: Record<string, number> = {};
  for (const doc of docsStemmed) {
    const termFrequency: Record<string, number> = {};
    doc.forEach((term) => {
      termFrequency[term] = (termFrequency[term] || 0) + 1;
    });

    Object.entries(termFrequency).forEach(([term, count]) => {
      const idf = Math.log((docsStemmed.length + 1) / ((documentFrequency[term] || 0) + 1)) + 1;
      aggScores[term] = (aggScores[term] || 0) + count * idf;
    });
  }

  // --- 5. Sort stems by score and map each stem back to best original token
  const sortedStems = Object.entries(aggScores)
    .sort((a, b) => b[1] - a[1])
    .map(([stem]) => stem);

  const keywords: string[] = [];
  const used = new Set<string>();

  for (const stem of sortedStems) {
    if (keywords.length >= maxKeywords) break;

    const originalMap = stemToOriginalFreq[stem] || {};
    // pick highest-frequency original token for this stem
    const rep = Object.entries(originalMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? stem;

    // avoid duplicates and extremely short tokens
    const token = rep.replace(/[^a-z0-9\- ]/g, "").trim();
    if (!token || used.has(token) || token.length < 2) continue;

    used.add(token);
    keywords.push(token);
  }

  return keywords;
}
