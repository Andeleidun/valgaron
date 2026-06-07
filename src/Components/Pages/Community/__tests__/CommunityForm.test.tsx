import { render, fireEvent, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CommunityForm from '../CommunityForm';
import { ToastProvider } from '../../../Common';
import { fetchTranslations, getThemeOptions } from '../../../../Utlilities';
import { friendGroups } from '../../../../Utlilities/groupData';
import type {
  CommonStringsType,
  GroupType,
  InteractionGateType,
  ModeType,
  ProfileStringsType,
} from '../../../../types';

/**
 * Render the Community form with the shared app theme.
 */
const renderCommunityForm = ({
  initialGroup,
  interactionGate,
}: {
  initialGroup?: GroupType;
  interactionGate?: InteractionGateType;
} = {}) => {
  const translations = fetchTranslations();
  const commonStrings: CommonStringsType = translations.common;
  const profileStrings: ProfileStringsType = translations.profile;
  const mode: ModeType = { id: 'friends' };
  const theme = createTheme(
    getThemeOptions({ themeMode: 'light', whoMode: mode })
  );
  const onSubmitGroup = jest.fn();

  const renderResult = render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <CommunityForm
          commonStrings={commonStrings}
          profileStrings={profileStrings}
          language="en"
          mode={mode}
          onSubmitGroup={onSubmitGroup}
          initialGroup={initialGroup}
          interactionGate={interactionGate}
        />
      </ToastProvider>
    </ThemeProvider>
  );

  return { ...renderResult, onSubmitGroup };
};

describe('CommunityForm', () => {
  test('includes starred tags in the submission payload', () => {
    const { container, onSubmitGroup } = renderCommunityForm({
      initialGroup: friendGroups[0],
    });
    const form = container.querySelector('form');

    if (!form) {
      throw new Error('Expected form element to be rendered');
    }

    fireEvent.submit(form);

    expect(onSubmitGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        groupName: friendGroups[0].groupName,
        mode: 'friends',
      })
    );
  });

  test('preserves governance, roles, events, and availability options on edit', () => {
    const existingGroup: GroupType = {
      ...friendGroups[0],
      governance: {
        joinPolicy: 'approval_required',
        postingPolicy: 'admins_and_roles',
        moderationSummary: 'Moderator review required for event posts.',
      },
      roles: [
        {
          id: 'organizer',
          name: 'Organizer',
          description: 'Coordinates planning.',
          permissionIds: ['schedule_events'],
        },
      ],
      events: [
        {
          id: 'event-1',
          title: 'Coffee Meetup',
          description: 'Plan the next coffee meetup.',
          location: 'Portland',
          startsAt: '2026-05-01T18:30:00.000Z',
          createdBy: 'group-owner',
          attendance: {
            going: ['group-owner'],
            interested: [],
            cant_make_it: [],
          },
        },
      ],
      availabilityOptions: [
        {
          id: 'availability-1',
          label: 'Saturday morning',
          voterUserIds: ['group-owner'],
        },
      ],
    };
    const { container, onSubmitGroup } = renderCommunityForm({
      initialGroup: existingGroup,
    });
    const form = container.querySelector('form');

    if (!form) {
      throw new Error('Expected form element to be rendered');
    }

    fireEvent.submit(form);

    expect(onSubmitGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        governance: existingGroup.governance,
        roles: existingGroup.roles,
        events: existingGroup.events,
        availabilityOptions: existingGroup.availabilityOptions,
      })
    );
  });

  test('shows validation errors when required fields are missing', () => {
    const { container } = renderCommunityForm();
    const form = container.querySelector('form');

    if (!form) {
      throw new Error('Expected form element to be rendered');
    }

    fireEvent.submit(form);

    expect(screen.getByText('Group name is required.')).toBeInTheDocument();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(screen.getByText('Category is required.')).toBeInTheDocument();
    expect(screen.getByText('Location is required.')).toBeInTheDocument();
    expect(screen.getByText('Group type is required.')).toBeInTheDocument();
  });

  test('disables group creation when the activation gate is locked', () => {
    const { onSubmitGroup } = renderCommunityForm({
      interactionGate: {
        isLocked: true,
        message: 'Complete your profile before creating or managing groups.',
      },
    });

    expect(
      screen.getByText(
        /Complete your profile before creating or managing groups/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmitGroup).not.toHaveBeenCalled();
  });
});
