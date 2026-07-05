import { describe, expect, it } from '@jest/globals';
import {
  codexDataHelpDetails,
  codexDataHelpSummary,
  codexDataHelpTopics,
  codexHelpFocusTopics,
  codexHelpQuickActions,
  codexHelpScreenSections,
  codexHelpSectionTitles,
  codexOfflineHelp,
  codexReleaseLimitsHelp,
  codexWorkflowHelpTopics,
  getCodexHelpFocus,
  getCodexHelpRoute,
  getCodexHelpScreenModel,
  isCodexHelpFocusId,
} from './helpTopics';

describe('help topics', () => {
  it('covers the core codex workflows shared by web and mobile', () => {
    expect(codexWorkflowHelpTopics.map((topic) => topic.title)).toEqual([
      'Build the codex',
      'Connect records',
      'Protect local work',
    ]);
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'character category'
    );
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'ancestry and profession stay flexible'
    );
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).toContain(
      'relationship-backed character fields'
    );
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).toContain(
      'visible from both sides'
    );
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).toContain(
      'related lore'
    );
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).not.toContain('forms');
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
    expect(codexHelpScreenSections.quickActions.title).toBe(
      'Open a workspace area'
    );
    expect(codexHelpScreenSections.workflow.ariaLabel).toBe('Workflow help');
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
    expect(getCodexHelpFocus('timeline')?.path).toBe('/help?topic=timeline');
    expect(isCodexHelpFocusId('timeline')).toBe(true);
    expect(isCodexHelpFocusId('unknown')).toBe(false);
    expect(getCodexHelpFocus('unknown')).toBeNull();
    expect(getCodexHelpRoute()).toBe('/help');
    expect(getCodexHelpRoute('relationships')).toBe(
      '/help?topic=relationships'
    );
  });

  it('provides shared quick actions for Help navigation', () => {
    expect(codexHelpQuickActions).toEqual([
      { id: 'entries', label: 'Open Entries', path: '/entries' },
      {
        id: 'relationships',
        label: 'Open Relationships',
        path: '/relationships',
      },
      { id: 'workspaces', label: 'Open Workspaces', path: '/workspaces' },
      { id: 'data', label: 'Open Data', path: '/data' },
    ]);
  });

  it('builds a shared help screen model', () => {
    const model = getCodexHelpScreenModel('data');

    expect(model.app).toEqual({
      title: 'Valgaron World Codex',
      version: '0.0.0',
      versionText: 'Version 0.0.0.',
    });
    expect(model.sections).toBe(codexHelpScreenSections);
    expect(model.focusedTopic?.title).toBe('Backups and recovery');
    expect(model.focusedTopic?.path).toBe('/help?topic=data');
    expect(model.focusTopics).toBe(codexHelpFocusTopics);
    expect(model.quickActions).toBe(codexHelpQuickActions);
    expect(model.workflowTopics).toBe(codexWorkflowHelpTopics);
    expect(model.data.title).toBe('Backups and recovery');
    expect(model.offline.title).toBe('Installable app limits');
    expect(getCodexHelpScreenModel('missing').focusedTopic).toBeNull();
  });
});
