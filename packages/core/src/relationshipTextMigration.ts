export type RelationshipTextMigrationCandidate = {
  id: string;
  name: string;
};

export type RelationshipTextMigrationAmbiguousFragment = {
  fragment: string;
  targetIds: string[];
};

export type RelationshipTextMigrationResult = {
  fragments: string[];
  targetIds: string[];
  matchedFragments: string[];
  unmatchedFragments: string[];
  ambiguousFragments: RelationshipTextMigrationAmbiguousFragment[];
  remainingText: string;
};

function normalizeRelationshipText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function splitRelationshipTextFragments(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((fragment) =>
      fragment
        .trim()
        .replace(/^[-*•]\s*/, '')
        .replace(/^["']|["']$/g, '')
        .trim()
    )
    .filter(Boolean);
}

export function buildRelationshipTextMigration(
  value: string,
  candidates: readonly RelationshipTextMigrationCandidate[],
  cardinality: 'one' | 'many'
): RelationshipTextMigrationResult {
  const fragments = splitRelationshipTextFragments(value);
  const candidatesByName = new Map<
    string,
    RelationshipTextMigrationCandidate[]
  >();

  for (const candidate of candidates) {
    const normalizedName = normalizeRelationshipText(candidate.name);
    if (!normalizedName) {
      continue;
    }
    const existingCandidates = candidatesByName.get(normalizedName) ?? [];
    existingCandidates.push(candidate);
    candidatesByName.set(normalizedName, existingCandidates);
  }

  const matchedFragments: string[] = [];
  const unmatchedFragments: string[] = [];
  const ambiguousFragments: RelationshipTextMigrationAmbiguousFragment[] = [];
  const targetIds: string[] = [];

  for (const fragment of fragments) {
    const matchedCandidates =
      candidatesByName.get(normalizeRelationshipText(fragment)) ?? [];
    if (matchedCandidates.length === 0) {
      unmatchedFragments.push(fragment);
      continue;
    }
    if (matchedCandidates.length > 1) {
      ambiguousFragments.push({
        fragment,
        targetIds: matchedCandidates.map((candidate) => candidate.id),
      });
      continue;
    }
    matchedFragments.push(fragment);
    const targetId = matchedCandidates[0].id;
    if (!targetIds.includes(targetId)) {
      targetIds.push(targetId);
    }
  }

  if (cardinality === 'one' && targetIds.length !== 1) {
    return {
      fragments,
      targetIds: [],
      matchedFragments: [],
      unmatchedFragments: fragments,
      ambiguousFragments,
      remainingText: value.trim(),
    };
  }

  return {
    fragments,
    targetIds,
    matchedFragments,
    unmatchedFragments,
    ambiguousFragments,
    remainingText: [
      ...unmatchedFragments,
      ...ambiguousFragments.map((item) => item.fragment),
    ].join('\n'),
  };
}
