import { describe, expect, it } from '@jest/globals';
import {
  codexDataHelpDetails,
  codexDataHelpSummary,
  codexDataHelpTopics,
  codexHelpFocusTopics,
  codexHelpSectionTitles,
  codexOfflineHelp,
  codexReleaseLimitsHelp,
  codexWorkflowHelpTopics,
  getCodexHelpFocus,
  getCodexHelpRoute,
} from './helpTopics';

describe('help topics', () => {
  it('covers the core codex workflows shared by web and mobile', () => {
    expect(codexWorkflowHelpTopics.map((topic) => topic.title)).toEqual([
      'Build the codex',
      'Connect records',
      'Protect local work',
    ]);
  });

  it('covers import and export guidance for compact mobile help', () => {
    expect(codexDataHelpTopics.map((topic) => topic.title)).toEqual([
      'JSON export',
      'Markdown export',
      'Import and reset',
    ]);
  });

  it('keeps local data guidance platform-neutral for web and mobile', () => {
    expect(codexDataHelpSummary).toContain('web');
    expect(codexDataHelpSummary).toContain('header Save button');
    expect(codexDataHelpSummary).toContain('mobile');
    expect(codexDataHelpSummary).toContain('device storage');
    expect(codexDataHelpSummary).toContain('does not add account');
    expect(codexWorkflowHelpTopics[2]?.items[0]).toContain(
      'on mobile, confirm the latest device-save status'
    );
    expect(codexDataHelpDetails.map((detail) => detail.term)).toEqual([
      'JSON export',
      'Markdown export',
      'Import',
      'Reset',
      'Snapshots',
    ]);
    expect(codexOfflineHelp).toContain('Offline use');
    expect(codexOfflineHelp).toContain('does not protect data');
    expect(codexHelpSectionTitles.offline).toBe('Installable app limits');
  });

  it('does not list native mobile as out of scope while mobile is in this workspace', () => {
    expect(codexReleaseLimitsHelp).not.toMatch(/native mobile apps/i);
    expect(codexReleaseLimitsHelp).toContain('cloud sync');
  });

  it('provides routeable focused help topics for contextual web and mobile links', () => {
    expect(codexHelpFocusTopics.map((topic) => topic.id)).toEqual([
      'start',
      'entries',
      'relationships',
      'timeline',
      'workspaces',
      'data',
      'support',
      'limits',
    ]);
    expect(getCodexHelpFocus('timeline')?.title).toBe('Timeline');
    expect(getCodexHelpFocus('unknown')).toBeNull();
    expect(getCodexHelpRoute()).toBe('/help');
    expect(getCodexHelpRoute('relationships')).toBe(
      '/help?topic=relationships'
    );
  });
});
