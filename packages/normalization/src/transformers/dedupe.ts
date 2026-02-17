import type { CanonicalProgram } from "../types/canonical.js";

export interface DeduplicationConfig {
  readonly nameSimilarityThreshold: number;
  readonly urlSimilarityThreshold: number;
  readonly exactMatchThreshold: number;
  readonly enabled: boolean;
}

export interface DuplicateGroup {
  readonly canonical: CanonicalProgram;
  readonly duplicates: readonly CanonicalProgram[];
  readonly matchScore: number;
  readonly matchReasons: readonly string[];
}

export interface DeduplicationResult {
  readonly uniquePrograms: readonly CanonicalProgram[];
  readonly duplicateGroups: readonly DuplicateGroup[];
  readonly totalDuplicates: number;
}

const DEFAULT_CONFIG: DeduplicationConfig = {
  nameSimilarityThreshold: 0.75,
  urlSimilarityThreshold: 0.9,
  exactMatchThreshold: 0.95,
  enabled: true,
};

function isValidProgram(program: CanonicalProgram | undefined): program is CanonicalProgram {
  return program !== undefined;
}

function getProgramId(program: CanonicalProgram, index: number): string {
  return program.id ?? `idx-${index}`;
}

function createDuplicateGroup(
  canonical: CanonicalProgram,
  duplicates: CanonicalProgram[],
  processedIds: Set<string>,
): DuplicateGroup {
  const matchReasons = getMatchReasons(canonical, duplicates);
  let maxScore = 0;
  for (const dup of duplicates) {
    const score = calculateSimilarity(canonical.name, dup.name, canonical.slug, dup.slug);
    if (score > maxScore) maxScore = score;
  }

  const canonicalId = getProgramId(canonical, 0);
  processedIds.add(canonicalId);

  return {
    canonical,
    duplicates,
    matchScore: maxScore,
    matchReasons,
  };
}

function getMatchReasons(
  canonical: CanonicalProgram,
  duplicates: CanonicalProgram[],
): readonly string[] {
  if (duplicates.length === 1) {
    const dup = duplicates[0];
    if (dup) {
      return [`Name similarity: ${calculateSimilarity(canonical.name, dup.name) * 100}%`];
    }
  }
  return [`${duplicates.length} duplicate(s) found`];
}

function calculateSimilarity(name1: string, name2: string, slug1?: string, slug2?: string): number {
  const words1 = name1.toLowerCase().split(/\s+/);
  const words2 = name2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  let score = intersection.size / union.size;

  if (slug1 && slug2 && slug1 === slug2) {
    score = (score + 1.0) / 2;
  }

  return score;
}

export class DeduplicationEngine {
  private config: DeduplicationConfig;

  constructor(config: Partial<DeduplicationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  deduplicate(programs: CanonicalProgram[]): DeduplicationResult {
    if (!this.config.enabled || programs.length === 0) {
      return {
        uniquePrograms: programs,
        duplicateGroups: [],
        totalDuplicates: 0,
      };
    }

    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();
    const uniquePrograms: CanonicalProgram[] = [];

    for (let i = 0; i < programs.length; i++) {
      const current = programs[i];
      if (!isValidProgram(current)) continue;

      const currentId = getProgramId(current, i);
      if (processedIds.has(currentId)) continue;

      const duplicates = this.findDuplicatesForProgram(programs, current, i, processedIds);

      if (duplicates.length > 0) {
        duplicateGroups.push(createDuplicateGroup(current, duplicates, processedIds));
      } else {
        uniquePrograms.push(current);
      }
    }

    return {
      uniquePrograms,
      duplicateGroups,
      totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0),
    };
  }

  private findDuplicatesForProgram(
    programs: CanonicalProgram[],
    current: CanonicalProgram,
    currentIndex: number,
    processedIds: Set<string>,
  ): CanonicalProgram[] {
    const duplicates: CanonicalProgram[] = [];

    for (let j = currentIndex + 1; j < programs.length; j++) {
      const other = programs[j];
      if (!isValidProgram(other)) continue;

      const otherId = getProgramId(other, j);
      if (processedIds.has(otherId)) continue;

      const similarity = calculateSimilarity(current.name, other.name, current.slug, other.slug);

      if (similarity >= this.config.exactMatchThreshold) {
        duplicates.push(other);
        processedIds.add(otherId);
      }
    }

    return duplicates;
  }

  comparePrograms(
    a: CanonicalProgram,
    b: CanonicalProgram,
  ): {
    score: number;
    reasons: readonly string[];
  } {
    const reasons: string[] = [];
    let score = calculateSimilarity(a.name, b.name, a.slug, b.slug);

    if (score >= this.config.nameSimilarityThreshold) {
      reasons.push(`Name similarity: ${(score * 100).toFixed(0)}%`);
    }

    if (a.slug && b.slug && a.slug === b.slug) {
      reasons.push("Slug match");
      score = (score + 1.0) / 2;
    }

    if (a.canonicalSourceUrl && b.canonicalSourceUrl) {
      const urlSim = this.calculateUrlSimilarity(a.canonicalSourceUrl, b.canonicalSourceUrl);
      if (urlSim >= this.config.urlSimilarityThreshold) {
        reasons.push("Source URL match");
        score = (score + urlSim) / 2;
      }
    }

    if (a.jurisdictionId && b.jurisdictionId) {
      if (a.jurisdictionId.toLowerCase() === b.jurisdictionId.toLowerCase()) {
        reasons.push("Same jurisdiction");
      }
    }

    return { score, reasons };
  }

  private calculateUrlSimilarity(url1: string, url2: string): number {
    const domain1 = this.extractDomain(url1);
    const domain2 = this.extractDomain(url2);

    if (domain1 && domain2 && domain1 === domain2) {
      const path1 = this.extractPath(url1);
      const path2 = this.extractPath(url2);
      if (path1 === path2) return 1.0;
      return calculateSimilarity(path1, path2);
    }

    return calculateSimilarity(url1, url2);
  }

  private extractDomain(urlString: string): string {
    try {
      const match = urlString.match(/^(?:https?:\/\/)?([^/]+)/);
      return match?.[1] ? match[1] : "";
    } catch {
      return "";
    }
  }

  private extractPath(urlString: string): string {
    try {
      const match = urlString.match(/^(?:https?:\/\/[^/]+)([^?]*)/);
      return match?.[1] ? match[1] : "";
    } catch {
      return "";
    }
  }

  findSimilar(
    program: CanonicalProgram,
    candidates: CanonicalProgram[],
    threshold: number = DEFAULT_CONFIG.nameSimilarityThreshold,
  ): readonly { candidate: CanonicalProgram; score: number }[] {
    const results: { candidate: CanonicalProgram; score: number }[] = [];

    for (const candidate of candidates) {
      if (program.id && candidate.id === program.id) continue;

      const similarity = calculateSimilarity(
        program.name,
        candidate.name,
        program.slug,
        candidate.slug,
      );

      if (similarity >= threshold) {
        results.push({ candidate, score: similarity });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }
}

export const defaultDeduplicationEngine = new DeduplicationEngine();
