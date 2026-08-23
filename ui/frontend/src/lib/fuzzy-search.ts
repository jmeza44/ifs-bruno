/**
 * Segment-based fuzzy matcher for PascalCase/camelCase identifiers (projection names,
 * endpoint paths). Lets a query like "CustOrInv" match "CustomerOrderInvoiceHandling"
 * by aligning query characters against PREFIXES of the target's word segments
 * ("Customer", "Order", "Invoice", "Handling"), consumed left-to-right with segments
 * skippable at a cost.
 *
 * Scoring favors: longer contiguous chunks per segment (quadratic bonus), matches
 * starting at the first segment, fully-consumed segments, and — when the query itself
 * has internal uppercase letters (e.g. "CustOrInv") — chunk boundaries that align with
 * where the user placed those uppercase letters, treating their casing as an explicit
 * "new word starts here" hint (same idea as VS Code / Sublime Text's camelCase query
 * filtering).
 */

export type FuzzyMatch = {
  score: number;
  /** Matched character ranges in the target string, as [start, end) pairs. */
  ranges: [number, number][];
};

const SEGMENT_SKIP_PENALTY = 1.5;
const CHUNK_BASE_BONUS = 4.0;
const CHUNK_PER_CHAR_BONUS = 3.0;
const CHUNK_QUADRATIC_BONUS = 0.5;
const FULL_SEGMENT_BONUS = 2.0;
const FIRST_SEGMENT_BONUS = 3.0;
const COVERAGE_WEIGHT = 6.0;
const CASING_HINT_BONUS = 10.0;

type Segment = { start: number; text: string };

function isAlnum(ch: string): boolean {
  return /[a-zA-Z0-9]/.test(ch);
}

/** Splits `s` into word segments at PascalCase/camelCase/separator/digit boundaries. */
function splitSegments(s: string): Segment[] {
  if (!s) return [];
  const boundaries = new Set<number>([0, s.length]);
  for (let i = 1; i < s.length; i++) {
    const prev = s[i - 1];
    const cur = s[i];
    if (!isAlnum(prev) || !isAlnum(cur)) {
      boundaries.add(i);
    } else if (prev === prev.toLowerCase() && prev !== prev.toUpperCase() && cur === cur.toUpperCase() && cur !== cur.toLowerCase()) {
      boundaries.add(i); // lower -> Upper camelCase hump
    } else if (/[a-zA-Z]/.test(prev) && /[0-9]/.test(cur)) {
      boundaries.add(i);
    } else if (/[0-9]/.test(prev) && /[a-zA-Z]/.test(cur)) {
      boundaries.add(i);
    }
  }
  const sorted = [...boundaries].sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const text = s.slice(a, b);
    if (text && /^[a-zA-Z0-9]+$/.test(text)) {
      segments.push({ start: a, text });
    }
  }
  return segments;
}

/**
 * Strips characters that can never appear inside a target segment (splitSegments drops
 * them as boundaries), so the query is compared against target segments in the same
 * alphabet — e.g. a leading "/" or key-predicate punctuation like "(", "'", "{" would
 * otherwise never match anything and fail the whole query.
 */
function sanitizeQuery(query: string): string {
  return query.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Indices in `query` where the user's own casing marks a new chunk. Only active when
 * the query has at least one internal uppercase letter (a deliberate camelCase hint) —
 * plain lowercase or plain UPPERCASE queries get no hint and fall back to free-form
 * segment alignment.
 */
function queryChunkStarts(query: string): Set<number> {
  const hasInternalUpper = [...query.slice(1)].some((c) => c !== c.toLowerCase());
  if (!hasInternalUpper) return new Set();
  const starts = new Set<number>([0]);
  for (let i = 1; i < query.length; i++) {
    if (query[i] !== query[i].toLowerCase()) starts.add(i);
  }
  return starts;
}

const NEG_INF = Number.NEGATIVE_INFINITY;

/**
 * Matches `query` against `target` using segment-prefix DP. Returns null if the query
 * isn't a valid (possibly non-contiguous) match, otherwise a score (higher = better)
 * and the matched character ranges for highlighting.
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query) return { score: 0, ranges: [] };

  const cleanQuery = sanitizeQuery(query);
  const q = cleanQuery.toLowerCase();
  const segments = splitSegments(target);
  const segTexts = segments.map((s) => s.text.toLowerCase());
  const n = q.length;
  const m = segments.length;
  if (n === 0 || m === 0) return null;

  const hintStarts = queryChunkStarts(cleanQuery);

  // best[qi][si]: best score matching query[0:qi] using segments[0:si]
  const best: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(NEG_INF));
  const choice: (['skip'] | ['take', number] | null)[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(null),
  );
  best[0][0] = 0;

  for (let si = 0; si <= m; si++) {
    for (let qi = 0; qi <= n; qi++) {
      const cur = best[qi][si];
      if (cur === NEG_INF) continue;
      if (si >= m) continue;

      const skipScore = cur - SEGMENT_SKIP_PENALTY;
      if (skipScore > best[qi][si + 1]) {
        best[qi][si + 1] = skipScore;
        choice[qi][si + 1] = ['skip'];
      }

      const segText = segTexts[si];
      const maxL = Math.min(segText.length, n - qi);
      let common = 0;
      while (common < maxL && segText[common] === q[qi + common]) common++;

      for (let l = 1; l <= common; l++) {
        let bonus = CHUNK_BASE_BONUS + CHUNK_PER_CHAR_BONUS * l + CHUNK_QUADRATIC_BONUS * l * l;
        if (l === segText.length) bonus += FULL_SEGMENT_BONUS;
        if (si === 0) bonus += FIRST_SEGMENT_BONUS;
        if (hintStarts.has(qi)) bonus += CASING_HINT_BONUS;
        const newScore = cur + bonus;
        if (newScore > best[qi + l][si + 1]) {
          best[qi + l][si + 1] = newScore;
          choice[qi + l][si + 1] = ['take', l];
        }
      }
    }
  }

  let bestFinal = NEG_INF;
  let bestSi = -1;
  for (let si = 0; si <= m; si++) {
    if (best[n][si] > bestFinal) {
      bestFinal = best[n][si];
      bestSi = si;
    }
  }
  if (bestSi === -1) return null;

  const ranges: [number, number][] = [];
  let qi = n;
  let si = bestSi;
  while (si > 0) {
    const c = choice[qi][si];
    if (!c) break;
    if (c[0] === 'take') {
      const l = c[1];
      const seg = segments[si - 1];
      ranges.push([seg.start, seg.start + l]);
      qi -= l;
    }
    si -= 1;
  }
  ranges.reverse();

  const matchedChars = ranges.reduce((sum, [a, b]) => sum + (b - a), 0);
  const coverage = matchedChars / target.length;
  const score = bestFinal / n + coverage * COVERAGE_WEIGHT;

  return { score, ranges };
}

/**
 * Filters and ranks `items` by fuzzy match quality against `query`, using `getText` to
 * extract the searchable string from each item. Items that don't match are excluded.
 */
export function fuzzySearch<T>(items: T[], query: string, getText: (item: T) => string): T[] {
  const term = query.trim();
  if (!term) return items;

  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const match = fuzzyMatch(term, getText(item));
    if (match) scored.push({ item, score: match.score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}
