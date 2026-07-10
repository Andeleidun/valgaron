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
      'Arrange your drafting desk',
    ]);
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'Use Knowledge or mobile More to create custom entry types'
    );
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'Project Tools shortcuts'
    );
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'Review Hotspots'
    );
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'selected-record review summaries'
    );
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'durable vocabulary rows'
    );
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'character category'
    );
    expect(codexWorkflowHelpTopics[0]?.items.join(' ')).toContain(
      'ancestry and profession use workspace-owned vocabulary suggestions'
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
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).toContain(
      'Era Manager reassignment'
    );
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).toContain(
      'grouped event editing'
    );
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).toContain(
      'saved relationship summaries'
    );
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).toContain(
      'filtered new-event drafts'
    );
    expect(codexWorkflowHelpTopics[1]?.items.join(' ')).not.toContain('forms');
  });

  it('covers import and export guidance for compact mobile help', () => {
    expect(codexDataHelpTopics.map((topic) => topic.title)).toEqual([
      'JSON and ZIP export',
      'Markdown export',
      'Import and reset',
    ]);
  });

  it('keeps local data guidance platform-neutral for web and mobile', () => {
    expect(codexDataHelpSummary).toContain('web');
    expect(codexDataHelpSummary).toContain('header Save button');
    expect(codexDataHelpSummary).toContain('mobile');
    expect(codexDataHelpSummary).toContain(
      "installed app's local storage area"
    );
    expect(
      codexWorkflowHelpTopics
        .find((topic) => topic.title === 'Protect local work')
        ?.items.join(' ')
    ).toContain('mobile app storage area');
    expect(codexDataHelpSummary).toContain('does not add account');
    expect(codexWorkflowHelpTopics[2]?.items[0]).toContain(
      'on mobile, confirm the latest device-save status'
    );
    expect(codexWorkflowHelpTopics[2]?.items.join(' ')).toContain(
      'uninstalling the mobile app'
    );
    expect(codexDataHelpDetails.map((detail) => detail.term)).toEqual([
      'JSON and ZIP export',
      'Markdown export',
      'Import',
      'Reset',
      'Snapshots',
    ]);
    expect(codexOfflineHelp).toContain('Offline use');
    expect(codexOfflineHelp).toContain('does not protect data');
    expect(codexOfflineHelp).toContain('mobile app uninstall');
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
      'knowledge',
      'utilities',
      'workspaces',
      'data',
      'support',
      'limits',
    ]);
    expect(getCodexHelpFocus('timeline')?.title).toBe('Timeline');
    expect(getCodexHelpFocus('timeline')?.path).toBe('/help?topic=timeline');
    expect(getCodexHelpFocus('timeline')?.detail).toContain(
      'Era Manager reassignment'
    );
    expect(getCodexHelpFocus('timeline')?.detail).toContain(
      'grouped event editing'
    );
    expect(getCodexHelpFocus('timeline')?.detail).toContain(
      'contextual new-event drafts'
    );
    expect(getCodexHelpFocus('timeline')?.detail).toContain(
      'saved relationship summaries'
    );
    expect(getCodexHelpFocus('knowledge')?.detail).toContain(
      'create custom entry types'
    );
    expect(getCodexHelpFocus('knowledge')?.detail).toContain(
      'manage durable vocabulary values'
    );
    expect(getCodexHelpFocus('utilities')?.detail).toContain(
      'Project Tools hub'
    );
    expect(getCodexHelpFocus('utilities')?.detail).toContain(
      'top-level Data, Workspaces, and Help shortcuts'
    );
    expect(getCodexHelpFocus('utilities')?.detail).toContain('Review Hotspots');
    expect(getCodexHelpFocus('workspaces')?.detail).not.toContain(
      'custom entry types'
    );
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
      { id: 'entries', label: 'Open Workbench', path: '/entries' },
      {
        id: 'relationships',
        label: 'Open Relationships',
        path: '/relationships',
      },
      { id: 'timeline', label: 'Open Timeline', path: '/timeline' },
      { id: 'knowledge', label: 'Open Knowledge', path: '/knowledge' },
      {
        id: 'utilities',
        label: 'Open Utilities',
        path: '/utilities#project-tools',
      },
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
