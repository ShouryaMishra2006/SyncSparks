// src/utils/extractKeywords.ts
import natural from "natural";
// prefer named import for stopword to avoid CJS/ESM mismatch issues.
// If your TS config uses `esModuleInterop: false`, use `const { removeStopwords } = require('stopword')`.
import { removeStopwords } from "stopword";

type IdeaLike = string | { text?: string | null };

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

  // --- 2. Setup NLP tools (fresh per call)
  const tokenizer = new natural.WordTokenizer();
  const nounInflector = new natural.NounInflector();
  const stemmer = natural.PorterStemmer; // use .stem(token)

  // --- 3. Custom stopwords (augment default stopword list for better signal)
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

  // --- 4. Clean, tokenize, remove stopwords, singularize tokens, stem tokens
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

    const tokens = tokenizer.tokenize(cleaned);
    console.log("tokens from tokenizerin mindmap", tokens)

    const filtered = removeStopwords(tokens, extraStopwords).filter(
      (t) => t.length > 1 && !/^\d+$/.test(t)
    );

    // singularize (better merging of plurals), then stem for TF-IDF calculation
    const normalized = filtered.map((tok) => nounInflector.singularize(tok));
    console.log('filtered after stopwords', normalized)

    const stemmed = normalized.map((tok) => stemmer.stem(tok));
    console.log(stemmed)

    // record mapping stem -> original token frequencies
    normalized.forEach((orig:any, i:any) => {
      const s = stemmed[i];
      if (!stemToOriginalFreq[s]) stemToOriginalFreq[s] = {};
      stemToOriginalFreq[s][orig] = (stemToOriginalFreq[s][orig] || 0) + 1;
    });

    docsStemmed.push(stemmed);
  }
  

  // --- 5. Compute TF-IDF over stemmed terms (fresh instance)
  const tfidf = new natural.TfIdf();
  for (const doc of docsStemmed) {
    tfidf.addDocument(doc.join(" "));
  }
console.log(tfidf)
  // aggregate tfidf scores across all docs for each stemmed term
  const aggScores: Record<string, number> = {};
  for (let i = 0; i < docsStemmed.length; i++) {
    const terms = tfidf.listTerms(i); // terms are the stem tokens we added
    for (const item of terms) {
      aggScores[item.term] = (aggScores[item.term] || 0) + item.tfidf;
    }
  }

  // --- 6. Sort stems by score and map each stem back to best original token
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
