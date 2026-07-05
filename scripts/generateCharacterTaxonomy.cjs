const fs = require('node:fs');
const path = require('node:path');
const prettier = require('prettier');

const repoRoot = path.resolve(__dirname, '..');
const artifactPath = path.join(repoRoot, 'character-relationship-tree.json');
const outputPath = path.join(
  repoRoot,
  'packages/core/src/characterRelationshipTree.generated.ts'
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

function flattenTree(node) {
  return [node, ...(node.children ?? []).flatMap(flattenTree)];
}

function catalogEntries() {
  return artifact.fieldCatalog ?? [];
}

function profileEntries() {
  return artifact.commonFieldProfiles ?? [];
}

function shouldSuggestFromExistingValues(field) {
  return (
    field.valueType === 'customText' ||
    field.valueType === 'customTextList' ||
    field.id === 'characterCategory'
  );
}

const allowedFieldValueTypes = new Set([
  'category',
  'customText',
  'customTextList',
  'linkList',
  'longText',
  'status',
  'text',
  'textList',
]);
const allowedFieldCardinalities = new Set(['one', 'many']);

const treeNodes = flattenTree(artifact.tree);
assertNonEmptyStrings(
  treeNodes.map((node) => node.id),
  'Every tree node in character-relationship-tree.json must define a non-empty id.'
);
assertUnique(
  treeNodes.map((node) => node.id),
  'Duplicate tree node ids found in character-relationship-tree.json.'
);
const categoryNodes = treeNodes.filter((node) => node.category);
const supportedCharacterCategoryOptions = unique(
  categoryNodes.map((node) => node.category)
);
assert(
  supportedCharacterCategoryOptions.length === categoryNodes.length,
  'Duplicate character categories found in character-relationship-tree.json.'
);

const coreEntryFields = new Set(artifact.runtime?.coreEntryFields ?? []);
const sharedDetailFields = artifact.runtime?.sharedDetailFields ?? [];
assert(
  sharedDetailFields.length > 0,
  'runtime.sharedDetailFields is required.'
);
const supportedLinkedEntryKinds = new Set(
  artifact.scope?.linkedEntryKinds ?? []
);

const relationshipTypes = artifact.relationshipTypes ?? [];
assertNonEmptyStrings(
  relationshipTypes.map((relationshipType) => relationshipType.id),
  'Every relationship type in character-relationship-tree.json must define a non-empty id.'
);
assertUnique(
  relationshipTypes.map((relationshipType) => relationshipType.id),
  'Duplicate relationship type ids found in character-relationship-tree.json.'
);
assertNonEmptyStrings(
  relationshipTypes.map((relationshipType) => relationshipType.label),
  'Every relationship type in character-relationship-tree.json must define a non-empty label.'
);
assertNonEmptyStrings(
  relationshipTypes
    .map((relationshipType) => relationshipType.inverseLabel)
    .filter(Boolean),
  'Relationship inverse labels in character-relationship-tree.json must be non-empty when present.'
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
const relationshipTypeById = new Map(
  relationshipTypes.map((relationshipType) => [
    relationshipType.id,
    relationshipType,
  ])
);

const fieldCatalogEntries = catalogEntries();
assertNonEmptyStrings(
  fieldCatalogEntries.map((field) => field.id),
  'Every field in character-relationship-tree.json must define a non-empty id.'
);
assertUnique(
  fieldCatalogEntries.map((field) => field.id),
  'Duplicate field ids found in character-relationship-tree.json.'
);
assertNonEmptyStrings(
  profileEntries().map((profile) => profile.id),
  'Every profile in character-relationship-tree.json must define a non-empty id.'
);
assertUnique(
  profileEntries().map((profile) => profile.id),
  'Duplicate profile ids found in character-relationship-tree.json.'
);
const fieldCatalogById = new Map(
  fieldCatalogEntries.map((field) => [field.id, field])
);
for (const field of fieldCatalogEntries) {
  assert(
    allowedFieldValueTypes.has(field.valueType),
    `Field ${field.id} has unsupported valueType ${field.valueType}.`
  );
  assert(
    allowedFieldCardinalities.has(field.cardinality),
    `Field ${field.id} has unsupported cardinality ${field.cardinality}.`
  );
  assert(
    !field.relationshipType || field.valueType === 'linkList',
    `Relationship-backed character field ${field.id} must use valueType linkList.`
  );
  if (field.relationshipType) {
    assertNonEmptyStrings(
      field.targetKinds ?? [],
      `Relationship-backed character field ${field.id} must define non-empty target kinds.`
    );
    assert(
      (field.targetKinds ?? []).length > 0,
      `Relationship-backed character field ${field.id} must define target kinds.`
    );
    for (const targetKind of field.targetKinds ?? []) {
      assert(
        supportedLinkedEntryKinds.has(targetKind),
        `Relationship-backed character field ${field.id} target kind ${targetKind} is not supported.`
      );
    }
  }
}
for (const fieldKey of sharedDetailFields) {
  assert(
    fieldCatalogById.has(fieldKey),
    `Missing shared detail field ${fieldKey}.`
  );
}

const characterFieldCatalog = Object.fromEntries(
  fieldCatalogEntries
    .filter((field) => !coreEntryFields.has(field.id))
    .map((field) => [
      field.id,
      {
        key: field.id,
        label: field.label,
        valueType: field.valueType,
        suggestFromExistingValues: shouldSuggestFromExistingValues(field),
      },
    ])
);

const characterProfileFieldKeys = Object.fromEntries(
  profileEntries().map((profile) => [
    profile.id,
    profile.fields.filter((fieldKey) => !coreEntryFields.has(fieldKey)),
  ])
);

const characterProfileLabels = Object.fromEntries(
  profileEntries().map((profile) => [profile.id, profile.label])
);

const characterCategoryProfiles = Object.fromEntries(
  categoryNodes.map((node) => [
    node.category,
    node.recommendedFieldProfiles ?? node.fieldProfiles ?? [],
  ])
);

const relationshipFieldConfigs = fieldCatalogEntries
  .filter((field) => field.relationshipType && field.valueType === 'linkList')
  .map((field) => {
    const relationshipType = relationshipTypeById.get(field.relationshipType);
    assert(
      relationshipType,
      `Field ${field.id} references unknown relationship type ${field.relationshipType}.`
    );
    assert(
      field.cardinality === 'one' || field.cardinality === 'many',
      `Field ${field.id} has unsupported cardinality ${field.cardinality}.`
    );
    return {
      fieldKey: field.id,
      label: field.label,
      relationshipTypeId: relationshipType.id,
      relationshipTypeLabel: relationshipType.label,
      directional: Boolean(relationshipType.directional),
      cardinality: field.cardinality,
      currentEntryRole: field.currentEntryRole ?? 'source',
      targetEntryKinds: field.targetKinds ?? [],
    };
  });

for (const [profileId, fieldKeys] of Object.entries(
  characterProfileFieldKeys
)) {
  assert(fieldKeys.length > 0, `Profile ${profileId} has no runtime fields.`);
  for (const fieldKey of fieldKeys) {
    assert(
      characterFieldCatalog[fieldKey],
      `Profile ${profileId} references unknown field ${fieldKey}.`
    );
  }
}

for (const [category, profiles] of Object.entries(characterCategoryProfiles)) {
  assert(profiles.length > 0, `Category ${category} has no field profiles.`);
  for (const profileId of profiles) {
    assert(
      characterProfileFieldKeys[profileId],
      `Category ${category} references unknown profile ${profileId}.`
    );
  }
}

for (const config of relationshipFieldConfigs) {
  const relationshipType = relationshipTypeById.get(config.relationshipTypeId);
  for (const targetKind of config.targetEntryKinds) {
    assert(
      relationshipType.targetKinds.includes(targetKind),
      `Field ${config.fieldKey} target kind ${targetKind} is not supported by relationship type ${config.relationshipTypeId}.`
    );
  }
}

const output = [
  '// Generated by scripts/generateCharacterTaxonomy.cjs from character-relationship-tree.json.',
  '// Do not edit this file directly; edit the JSON artifact and rerun the generator.',
  '',
  `export const characterRelationshipTreeSchemaVersion = ${quote(
    artifact.schemaVersion
  )} as const;`,
  '',
  formatConst(
    'supportedCharacterCategoryOptions',
    supportedCharacterCategoryOptions
  ),
  formatConst('characterRelationshipTypeOptions', relationshipTypeOptions),
  formatConst('characterSharedFieldKeys', sharedDetailFields),
  formatConst('characterFieldCatalog', characterFieldCatalog),
  formatConst('characterProfileLabels', characterProfileLabels),
  formatConst('characterProfileFieldKeys', characterProfileFieldKeys),
  formatConst('characterCategoryProfiles', characterCategoryProfiles),
  formatConst('characterRelationshipFieldConfigs', relationshipFieldConfigs),
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
      'Generated character taxonomy is stale. Run npm run generate:character-taxonomy.'
    );
  }
} else {
  fs.writeFileSync(outputPath, formattedOutput);
}
