/**
 * TF-IDF Vectorizer & Cosine Similarity Search
 *
 * Zero-dependency implementation for the RAG pipeline.
 *
 *  - Tokenizes text → lowercased, alphanumeric tokens
 *  - Computes TF-IDF vectors for a corpus of documents
 *  - Performs cosine similarity search to find top-K matches
 */

// ── Types ──

export interface RAGDocument {
  /** Unique document ID */
  id: string;
  /** Natural-language content to search against */
  content: string;
  /** Metadata about the source */
  metadata: {
    source: string;
    category: string;
    department?: string;
    [key: string]: unknown;
  };
  /** Original raw data (for structured responses) */
  raw: Record<string, unknown>;
}

export interface SearchResult {
  document: RAGDocument;
  score: number;
}

// ── Tokenization ──

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "must", "can", "could", "am", "i", "me",
  "my", "we", "our", "you", "your", "he", "she", "it", "they", "them",
  "his", "her", "its", "their", "this", "that", "these", "those",
  "and", "but", "or", "nor", "not", "so", "yet", "both", "either",
  "neither", "each", "every", "all", "any", "few", "more", "most",
  "other", "some", "such", "no", "only", "own", "same", "than", "too",
  "very", "just", "because", "as", "until", "while", "of", "at", "by",
  "for", "with", "about", "against", "between", "through", "during",
  "before", "after", "above", "below", "to", "from", "up", "down",
  "in", "out", "on", "off", "over", "under", "again", "further",
  "then", "once", "here", "there", "when", "where", "why", "how",
  "what", "which", "who", "whom", "if",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[₹,]/g, " ")                      // strip currency + commas
    .replace(/[^a-z0-9\s.-]/g, " ")              // keep alphanumeric + dots + dashes
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

// ── TF-IDF Index ──

interface DocumentVector {
  doc: RAGDocument;
  termFreqs: Map<string, number>;
  magnitude: number;
}

export class TFIDFIndex {
  private vocabulary: Map<string, number> = new Map();  // term → document frequency
  private documentVectors: DocumentVector[] = [];
  private totalDocs = 0;
  private built = false;

  /**
   * Build the TF-IDF index from a corpus of documents.
   */
  build(documents: RAGDocument[]): void {
    this.vocabulary.clear();
    this.documentVectors = [];
    this.totalDocs = documents.length;

    if (this.totalDocs === 0) {
      this.built = true;
      return;
    }

    // ── Pass 1: Compute document frequency (DF) for each term ──
    const termDocSets: Map<string, Set<number>> = new Map();

    const rawTermFreqs: Array<Map<string, number>> = [];

    for (let i = 0; i < documents.length; i++) {
      const tokens = tokenize(documents[i].content);
      const tf: Map<string, number> = new Map();

      for (const token of tokens) {
        tf.set(token, (tf.get(token) ?? 0) + 1);
      }

      rawTermFreqs.push(tf);

      for (const term of tf.keys()) {
        let docSet = termDocSets.get(term);
        if (!docSet) {
          docSet = new Set();
          termDocSets.set(term, docSet);
        }
        docSet.add(i);
      }
    }

    // Store document frequencies
    for (const [term, docSet] of termDocSets) {
      this.vocabulary.set(term, docSet.size);
    }

    // ── Pass 2: Compute TF-IDF vectors ──
    for (let i = 0; i < documents.length; i++) {
      const tf = rawTermFreqs[i];
      const tfidf: Map<string, number> = new Map();
      let magnitudeSq = 0;

      // Find max term frequency for normalization
      let maxTf = 0;
      for (const count of tf.values()) {
        if (count > maxTf) maxTf = count;
      }

      for (const [term, count] of tf) {
        const df = this.vocabulary.get(term) ?? 1;
        // Augmented TF to prevent bias toward longer documents
        const normalizedTf = 0.5 + 0.5 * (count / (maxTf || 1));
        // IDF with smoothing
        const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;
        const weight = normalizedTf * idf;

        tfidf.set(term, weight);
        magnitudeSq += weight * weight;
      }

      this.documentVectors.push({
        doc: documents[i],
        termFreqs: tfidf,
        magnitude: Math.sqrt(magnitudeSq),
      });
    }

    this.built = true;
    console.log(`[RAG] TF-IDF index built: ${this.totalDocs} documents, ${this.vocabulary.size} unique terms`);
  }

  /**
   * Search the index for the top-K most relevant documents.
   */
  search(query: string, topK = 5): SearchResult[] {
    if (!this.built || this.documentVectors.length === 0) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Build query TF-IDF vector
    const queryTf: Map<string, number> = new Map();
    for (const token of queryTokens) {
      queryTf.set(token, (queryTf.get(token) ?? 0) + 1);
    }

    let maxQTf = 0;
    for (const c of queryTf.values()) {
      if (c > maxQTf) maxQTf = c;
    }

    const queryWeights: Map<string, number> = new Map();
    let queryMagSq = 0;

    for (const [term, count] of queryTf) {
      const df = this.vocabulary.get(term) ?? 0;
      if (df === 0) continue; // term not in corpus, skip

      const normalizedTf = 0.5 + 0.5 * (count / (maxQTf || 1));
      const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;
      const weight = normalizedTf * idf;

      queryWeights.set(term, weight);
      queryMagSq += weight * weight;
    }

    const queryMag = Math.sqrt(queryMagSq);
    if (queryMag === 0) return [];

    // Compute cosine similarity against every document
    const scored: SearchResult[] = [];

    for (const docVec of this.documentVectors) {
      if (docVec.magnitude === 0) continue;

      let dotProduct = 0;
      for (const [term, qWeight] of queryWeights) {
        const dWeight = docVec.termFreqs.get(term);
        if (dWeight !== undefined) {
          dotProduct += qWeight * dWeight;
        }
      }

      if (dotProduct === 0) continue;

      const cosineSim = dotProduct / (queryMag * docVec.magnitude);

      scored.push({
        document: docVec.doc,
        score: cosineSim,
      });
    }

    // Sort by score descending, take top-K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Number of indexed documents.
   */
  get size(): number {
    return this.totalDocs;
  }

  /**
   * Whether the index has been built.
   */
  get isBuilt(): boolean {
    return this.built;
  }
}
