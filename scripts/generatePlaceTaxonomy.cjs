const fs = require('node:fs');
const path = require('node:path');
const prettier = require('prettier');

const repoRoot = path.resolve(__dirname, '..');
const artifactPath = path.join(repoRoot, 'place-relationship-tree.json');
const outputPath = path.join(
  repoRoot,
  'packages/core/src/placeRelationshipTree.generated.ts'
);
const checkOnly = process.argv.includes('--check');

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function quote(value) {
  return JSON.stringify(value);
}

function unique(values) {
  return Array.from(new Set(values));
}

function assertUnique(values, message) {
  assert(unique(values).length === values.length, message);
}

function assertNonEmptyStrings(values, message) {
  assert(
    values.every((value) => typeof value === 'string' && value.trim()),
    message
  );
}

function formatConst(name, value) {
  return `export const ${name} = ${JSON.stringify(value, null, 2)} as const;\n`;
}

const allowedFieldValueTypes = new Set([
  'enum',
  'link',
  'linkList',
  'markdown',
  'string',
  'stringList',
]);

assertNonEmptyStrings(
  artifact.tree.map((node) => node.id),
  'Every tree node in place-relationship-tree.json must define a non-empty id.'
);
assertUnique(
  artifact.tree.map((node) => node.id),
  'Duplicate tree node ids found in place-relationship-tree.json.'
);
const categoryNodes = artifact.tree.filter((node) => node.category);
const supportedPlaceCategoryOptions = unique(
  categoryNodes.map((node) => node.category)
);
assert(
  supportedPlaceCategoryOptions.length === categoryNodes.length,
  'Duplicate place categories found in place-relationship-tree.json.'
);

const coreEntryFields = new Set(artifact.runtime?.coreEntryFields ?? []);
const sharedDetailFields = artifact.runtime?.sharedDetailFields ?? [];
assert(
  sharedDetailFields.length > 0,
  'runtime.sharedDetailFields is required.'
);
const supportedLinkedEntryKinds = new Set([
  'place',
  ...(artifact.scope?.nonPlaceLinkTargets ?? []),
]);

const relationshipTypes = artifact.relationshipTypes ?? [];
assertNonEmptyStrings(
  relationshipTypes.map((relationshipType) => relationshipType.id),
  'Every relationship type in place-relationship-tree.json must define a non-empty id.'
);
assertUnique(
  relationshipTypes.map((relationshipType) => relationshipType.id),
  'Duplicate relationship type ids found in place-relationship-tree.json.'
);
assertNonEmptyStrings(
  relationshipTypes.map((relationshipType) => relationshipType.label),
  'Every relationship type in place-relationship-tree.json must define a non-empty label.'
);
assertNonEmptyStrings(
  relationshipTypes
    .map((relationshipType) => relationshipType.inverseLabel)
    .filter(Boolean),
  'Relationship inverse labels in place-relationship-tree.json must be non-empty when present.'
);
for (const relationshipType of relationshipTypes) {
  assertNonEmptyStrings(
    relationshipType.targetKinds ?? [],
    `Relationship type ${relationshipType.id} must define non-empty target kinds.`
  );
  assert(
    (relationshipType.targetKinds ?? []).length > 0,
    `Relationship type ${relationshipType.id} must define target kinds.`
  );
  for (const targetKind of relationshipType.targetKinds ?? []) {
    assert(
      supportedLinkedEntryKinds.has(targetKind),
      `Relationship type ${relationshipType.id} target kind ${targetKind} is not supported.`
    );
  }
  for (const sourceKind of relationshipType.sourceKinds ?? []) {
    assert(
      supportedLinkedEntryKinds.has(sourceKind),
      `Relationship type ${relationshipType.id} source kind ${sourceKind} is not supported.`
    );
  }
}
const relationshipTypeOptions = unique(
  relationshipTypes.flatMap((relationshipType) =>
    [relationshipType.label, relationshipType.inverseLabel].filter(Boolean)
  )
);
const relationshipTypeByLabel = new Map(
  relationshipTypes.flatMap((relationshipType) =>
    [relationshipType.label, relationshipType.inverseLabel]
      .filter(Boolean)
      .map((label) => [label, relationshipType])
  )
);

const fieldCatalog = artifact.fieldCatalog ?? {};
for (const [fieldKey, field] of Object.entries(fieldCatalog)) {
  assert(
    allowedFieldValueTypes.has(field.valueType),
    `Field ${fieldKey} has unsupported valueType ${field.valueType}.`
  );
}
for (const fieldKey of sharedDetailFields) {
  assert(fieldCatalog[fieldKey], `Missing shared detail field ${fieldKey}.`);
}

const placeFieldCatalog = Object.fromEntries(
  Object.entries(fieldCatalog)
    .filter(([fieldKey]) => !coreEntryFields.has(fieldKey))
    .map(([fieldKey, field]) => [
      fieldKey,
      {
        key: fieldKey,
        label: field.label,
        valueType: field.valueType,
      },
    ])
);

const profileFieldKeys = Object.fromEntries(
  Object.entries(artifact.commonFieldProfiles ?? {}).map(
    ([profileId, fieldKeys]) => [
      profileId,
      fieldKeys.filter((fieldKey) => !coreEntryFields.has(fieldKey)),
    ]
  )
);

const categoryProfiles = Object.fromEntries(
  categoryNodes.map((node) => [node.category, node.fieldProfiles ?? []])
);

const relationshipFieldConfigs = Object.entries(fieldCatalog)
  .filter(([, field]) => field.relationshipType)
  .map(([fieldKey, field]) => {
    const relationshipType = relationshipTypeByLabel.get(
      field.relationshipType
    );
    assert(
      relationshipType,
      `Field ${fieldKey} references unknown relationship type ${field.relationshipType}.`
    );
    assert(
      field.valueType === 'link' || field.valueType === 'linkList',
      `Relationship-backed place field ${fieldKey} must use valueType link or linkList.`
    );
    assert(
      field.currentEntryRole === 'source' ||
        field.currentEntryRole === 'target',
      `Field ${fieldKey} must define currentEntryRole.`
    );
    assert(
      field.cardinality === 'zeroOrOne' || field.cardinality === 'zeroOrMany',
      `Field ${fieldKey} has unsupported cardinality ${field.cardinality}.`
    );
    assert(
      field.valueType !== 'link' || field.cardinality === 'zeroOrOne',
      `Relationship-backed place field ${fieldKey} with valueType link must use zeroOrOne cardinality.`
    );
    assert(
      field.valueType !== 'linkList' || field.cardinality === 'zeroOrMany',
      `Relationship-backed place field ${fieldKey} with valueType linkList must use zeroOrMany cardinality.`
    );
    assertNonEmptyStrings(
      field.targetEntryKinds ?? [],
      `Relationship-backed place field ${fieldKey} must define non-empty target entry kinds.`
    );
    assert(
      (field.targetEntryKinds ?? []).length > 0,
      `Relationship-backed place field ${fieldKey} must define target entry kinds.`
    );
    for (const targetKind of field.targetEntryKinds ?? []) {
      assert(
        supportedLinkedEntryKinds.has(targetKind),
        `Relationship-backed place field ${fieldKey} target entry kind ${targetKind} is not supported.`
      );
      assert(
        relationshipType.targetKinds.includes(targetKind),
        `Relationship-backed place field ${fieldKey} target entry kind ${targetKind} is not supported by relationship type ${relationshipType.id}.`
      );
    }
    return {
      fieldKey,
      label: field.label,
      relationshipType: field.relationshipType,
      directional: Boolean(relationshipType.directional),
      cardinality: field.cardinality === 'zeroOrOne' ? 'one' : 'many',
      currentEntryRole: field.currentEntryRole,
      targetEntryKinds: field.targetEntryKinds ?? [],
      ...(field.targetCategories
        ? { targetPlaceCategories: field.targetCategories }
        : {}),
      ...(field.targetCategoryBehavior
        ? { targetCategoryBehavior: field.targetCategoryBehavior }
        : {}),
    };
  });

for (const config of relationshipFieldConfigs) {
  for (const category of config.targetPlaceCategories ?? []) {
    assert(
      supportedPlaceCategoryOptions.includes(category),
      `Field ${config.fieldKey} references unsupported target category ${category}.`
    );
  }
}

for (const [profileId, fieldKeys] of Object.entries(profileFieldKeys)) {
  assert(fieldKeys.length > 0, `Profile ${profileId} has no runtime fields.`);
  for (const fieldKey of fieldKeys) {
    assert(
      placeFieldCatalog[fieldKey],
      `Profile ${profileId} references unknown field ${fieldKey}.`
    );
  }
}

for (const [category, profiles] of Object.entries(categoryProfiles)) {
  assert(profiles.length > 0, `Category ${category} has no field profiles.`);
  for (const profileId of profiles) {
    assert(
      profileFieldKeys[profileId],
      `Category ${category} references unknown profile ${profileId}.`
    );
  }
}

const output = [
  '// Generated by scripts/generatePlaceTaxonomy.cjs from place-relationship-tree.json.',
  '// Do not edit this file directly; edit the JSON artifact and rerun the generator.',
  '',
  `export const placeRelationshipTreeSchemaVersion = ${quote(
    artifact.schemaVersion
  )} as const;`,
  '',
  formatConst('supportedPlaceCategoryOptions', supportedPlaceCategoryOptions),
  formatConst('placeRelationshipTypeOptions', relationshipTypeOptions),
  formatConst('placeSharedFieldKeys', sharedDetailFields),
  formatConst('placeFieldCatalog', placeFieldCatalog),
  formatConst('profileFieldKeys', profileFieldKeys),
  formatConst('categoryProfiles', categoryProfiles),
  formatConst('placeRelationshipFieldConfigs', relationshipFieldConfigs),
].join('\n');

const formattedOutput = prettier.format(output, {
  parser: 'typescript',
  singleQuote: true,
  trailingComma: 'es5',
});

if (checkOnly) {
  const currentOutput = fs.readFileSync(outputPath, 'utf8');
  if (currentOutput !== formattedOutput) {
    throw new Error(
      'Generated place taxonomy is stale. Run npm run generate:place-taxonomy.'
    );
  }
} else {
  fs.writeFileSync(outputPath, formattedOutput);
}
