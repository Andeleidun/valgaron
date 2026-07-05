import { describe, expect, it } from '@jest/globals';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const retiredDuplicateHelperFiles = [
  'src/types.ts',
  'src/Utlilities/localDiagnostics.ts',
  'src/Utlilities/localDiagnostics.test.ts',
  'src/Utlilities/appMetadata.ts',
  'src/Utlilities/codexDataPortability.ts',
  'src/Utlilities/codexDataPortability.test.ts',
  'src/Utlilities/codexEntries.ts',
  'src/Utlilities/codexEntries.test.ts',
  'src/Utlilities/codexRelationships.ts',
  'src/Utlilities/codexRelationships.test.ts',
  'src/Utlilities/codexSearch.ts',
  'src/Utlilities/codexSearch.test.ts',
  'src/Utlilities/codexTemplates.ts',
  'src/Utlilities/codexTemplates.test.ts',
  'src/Utlilities/codexTimeline.ts',
  'src/Utlilities/codexTimeline.test.ts',
  'src/Utlilities/seedCodex.ts',
  'src/Utlilities/workspaceManagement.ts',
  'src/Utlilities/workspaceManagement.test.ts',
  'src/Utlilities/worldDocument.ts',
  'src/Utlilities/worldDocument.test.ts',
  'mobile/src/state/mobileCodexViewModels.ts',
  'mobile/src/state/mobileCodexViewModels.test.ts',
  'mobile/src/state/mobileCommitFeedback.ts',
  'mobile/src/state/mobileCommitFeedback.test.ts',
  'mobile/src/state/mobileDestructiveActions.ts',
  'mobile/src/state/mobileDestructiveActions.test.ts',
  'mobile/src/state/mobileFeedback.ts',
  'mobile/src/state/mobileFeedback.test.ts',
  'mobile/src/state/mobileRuntimeRecovery.ts',
  'mobile/src/state/mobileRuntimeRecovery.test.ts',
  'mobile/src/state/mobileUnsavedChanges.ts',
  'mobile/src/state/mobileUnsavedChanges.test.ts',
] as const;

const sourceRoots = ['src', 'mobile/src'] as const;
const sourceExtensions = ['.ts', '.tsx'] as const;
const forbiddenImportFragments = [
  'localDiagnostics',
  'appMetadata',
  'mobileCodexViewModels',
  'mobileCommitFeedback',
  'mobileDestructiveActions',
  'mobileFeedback',
  'mobileRuntimeRecovery',
  'mobileUnsavedChanges',
] as const;

const webDocumentStateForbiddenWrapperImports = [
  './codexEntries',
  './codexRelationships',
  './workspaceManagement',
  './worldDocument',
] as const;

const retiredWebCoreWrapperImportPaths = [
  './codexDataPortability',
  './codexEntries',
  './codexRelationships',
  './codexSearch',
  './codexTemplates',
  './codexTimeline',
  './seedCodex',
  './workspaceManagement',
  './worldDocument',
] as const;

const retiredControllerMutationFragments = [
  'deleteRelationshipsForEntry',
  'deletePlanetaryWorld',
  'getTimelineOrderUpdates',
  'setEntryArchived',
  'setPlanetaryWorldArchived',
  'upsertRelationship',
  'upsertPlanetaryWorld',
] as const;

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(path);
    }
    return sourceExtensions.some((extension) => entry.name.endsWith(extension))
      ? [path]
      : [];
  });
}

describe('frontend parity boundaries', () => {
  it('keeps retired duplicate frontend helpers out of the frontends', () => {
    for (const helperFile of retiredDuplicateHelperFiles) {
      expect(existsSync(join(process.cwd(), helperFile))).toBe(false);
    }

    const sourceFiles = sourceRoots.flatMap((root) =>
      collectSourceFiles(join(process.cwd(), root))
    );
    const staleReferences = sourceFiles.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return forbiddenImportFragments
        .filter((fragment) => text.includes(fragment))
        .map((fragment) => `${relative(process.cwd(), file)} -> ${fragment}`);
    });

    expect(staleReferences).toEqual([]);
  });

  it('keeps web document state domain operations imported from core', () => {
    const documentStatePath = join(
      process.cwd(),
      'src/Utlilities/useWorldDocumentState.ts'
    );
    const documentStateText = readFileSync(documentStatePath, 'utf8');

    expect(
      webDocumentStateForbiddenWrapperImports.filter((importPath) =>
        documentStateText.includes(importPath)
      )
    ).toEqual([]);
    expect(documentStateText).toContain("from '@valgaron/core'");
  });

  it('keeps retired web core wrapper imports out of web utilities', () => {
    const utilityFiles = collectSourceFiles(
      join(process.cwd(), 'src/Utlilities')
    );
    const staleImports = utilityFiles.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return retiredWebCoreWrapperImportPaths
        .filter((importPath) => text.includes(`from '${importPath}'`))
        .map(
          (importPath) => `${relative(process.cwd(), file)} -> ${importPath}`
        );
    });

    expect(staleImports).toEqual([]);
  });

  it('keeps repository gates on shared product metadata', () => {
    const metadataGatePath = join(
      process.cwd(),
      'scripts/checkAppMetadata.cjs'
    );
    const metadataGateText = readFileSync(metadataGatePath, 'utf8');

    expect(metadataGateText).toContain("'packages', 'core', 'src', 'shell.ts'");
    expect(metadataGateText).not.toContain(
      join('src', 'Utlilities', 'appMetadata.ts')
    );
  });

  it('keeps shared active-workspace mutations out of platform controllers', () => {
    const controllerFiles = [
      join(process.cwd(), 'src/Utlilities/useWorldDocumentState.ts'),
      join(process.cwd(), 'mobile/src/state/MobileCodexContext.tsx'),
    ];
    const staleControllerReferences = controllerFiles.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return retiredControllerMutationFragments
        .filter((fragment) => new RegExp(`\\b${fragment}\\b`).test(text))
        .map((fragment) => `${relative(process.cwd(), file)} -> ${fragment}`);
    });

    expect(staleControllerReferences).toEqual([]);
    for (const file of controllerFiles) {
      expect(readFileSync(file, 'utf8')).toContain('EntryInActiveWorkspace');
    }
  });
});
