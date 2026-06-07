import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GroupCard from '../../../Common/Card/GroupCard/GroupCard';
import GroupDetail from '../GroupDetail';
import { fetchTranslations } from '../../../../Utlilities';
import { ensureGroupGovernanceData } from '../../../../Utlilities/communityGovernance';
import type { GroupType } from '../../../../types';

describe('Community CTAs and empty states', () => {
  const baseGroup: GroupType = {
    id: 'group-cta',
    groupName: 'CTA Group',
    description: 'Test group',
    category: 'Test',
    location: 'Test City',
    groupType: 'Club',
    interests: ['Test'],
    rules: 'Be kind',
    groupPicture: '',
    tags: ['test'],
    members: [],
    createdAt: '2024-01-01',
    chatRooms: [],
    mode: 'friends',
  };

  test('Join/Leave toggles update GroupCard UI state', async () => {
    const translations = fetchTranslations();
    const Wrapper = () => {
      const [joined, setJoined] = useState(false);
      return (
        <GroupCard
          group={baseGroup}
          language="en"
          mode={{ id: 'friends' }}
          joined={joined}
          onJoinToggle={() => setJoined((prev) => !prev)}
          strings={{ common: translations.common }}
        />
      );
    };
    render(<Wrapper />);
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
  });

  test('Join/Leave toggles update GroupDetail UI state', async () => {
    const translations = fetchTranslations();
    const Wrapper = () => {
      const [joined, setJoined] = useState(false);
      return (
        <GroupDetail
          group={baseGroup}
          language="en"
          joined={joined}
          isAdmin={false}
          currentUserId="community-user"
          onJoinToggle={() => setJoined((prev) => !prev)}
          onBack={() => undefined}
          onAssignRole={() => undefined}
          onRemoveRole={() => undefined}
          onScheduleEvent={() => undefined}
          onRespondToEvent={() => undefined}
          onSetAvailabilityOptions={() => undefined}
          onVoteAvailability={() => undefined}
          strings={{ common: translations.common }}
        />
      );
    };
    render(<Wrapper />);
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
  });

  test('GroupDetail localizes permissive fallback governance copy for groups without stored governance', () => {
    const translations = fetchTranslations();

    render(
      <GroupDetail
        group={ensureGroupGovernanceData(baseGroup)}
        language="es"
        joined={false}
        isAdmin={false}
        currentUserId="community-user"
        onJoinToggle={() => undefined}
        onBack={() => undefined}
        onAssignRole={() => undefined}
        onRemoveRole={() => undefined}
        onScheduleEvent={() => undefined}
        onRespondToEvent={() => undefined}
        onSetAvailabilityOptions={() => undefined}
        onVoteAvailability={() => undefined}
        strings={{ common: translations.common }}
      />
    );

    expect(
      screen.getByText('Política de ingreso: Abierta')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Política de publicación: Todos los miembros')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Resumen de moderación: Las personas pueden unirse y participar directamente. Organizadores y moderadores intervienen cuando surgen temas de coordinación o seguridad.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Organizador')).toBeInTheDocument();
    expect(screen.getByText('Moderador')).toBeInTheDocument();
    expect(screen.getByText('Anfitrión de bienvenida')).toBeInTheDocument();
    expect(screen.queryByText('Organizer')).not.toBeInTheDocument();
  });

  test('GroupDetail supports roles, events, and availability flows', async () => {
    const translations = fetchTranslations();
    const governanceGroup: GroupType = {
      ...baseGroup,
      admins: ['community-user'],
      members: [
        {
          groupId: 'group-cta',
          userId: 'community-user',
          userName: 'Community User',
          joinedAt: '2024-01-01',
          roleIds: [],
        },
      ],
      governance: {
        joinPolicy: 'approval_required',
        postingPolicy: 'admins_and_roles',
        moderationSummary: 'Admins review joins and moderation follow-up.',
      },
      roles: [
        {
          id: 'organizer',
          name: 'Organizer',
          description: 'Coordinates events.',
          permissionIds: ['schedule_events'],
        },
      ],
      events: [],
      availabilityOptions: [],
    };

    const Wrapper = () => {
      const [group, setGroup] = useState(governanceGroup);
      return (
        <GroupDetail
          group={group}
          language="en"
          joined
          isAdmin
          currentUserId="community-user"
          onJoinToggle={() => undefined}
          onBack={() => undefined}
          onAssignRole={(_, memberUserId, roleId) =>
            setGroup((previousGroup) => ({
              ...previousGroup,
              members: previousGroup.members.map((member) =>
                member.userId === memberUserId
                  ? {
                      ...member,
                      roleIds: [...(member.roleIds ?? []), roleId],
                    }
                  : member
              ),
            }))
          }
          onRemoveRole={(_, memberUserId, roleId) =>
            setGroup((previousGroup) => ({
              ...previousGroup,
              members: previousGroup.members.map((member) =>
                member.userId === memberUserId
                  ? {
                      ...member,
                      roleIds: (member.roleIds ?? []).filter(
                        (existingRoleId) => existingRoleId !== roleId
                      ),
                    }
                  : member
              ),
            }))
          }
          onScheduleEvent={(_, title, description, location, startsAt) =>
            setGroup((previousGroup) => ({
              ...previousGroup,
              events: [
                ...(previousGroup.events ?? []),
                {
                  id: 'event-1',
                  title,
                  description,
                  location,
                  startsAt,
                  createdBy: 'community-user',
                  attendance: {
                    going: [],
                    interested: [],
                    cant_make_it: [],
                  },
                },
              ],
            }))
          }
          onRespondToEvent={(_, eventId, response) =>
            setGroup((previousGroup) => ({
              ...previousGroup,
              events: (previousGroup.events ?? []).map((event) =>
                event.id === eventId
                  ? {
                      ...event,
                      attendance: {
                        going: response === 'going' ? ['community-user'] : [],
                        interested:
                          response === 'interested' ? ['community-user'] : [],
                        cant_make_it:
                          response === 'cant_make_it' ? ['community-user'] : [],
                      },
                    }
                  : event
              ),
            }))
          }
          onSetAvailabilityOptions={(_, labels) =>
            setGroup((previousGroup) => ({
              ...previousGroup,
              availabilityOptions: labels.map((label, index) => ({
                id: `availability-${index}`,
                label,
                voterUserIds: [],
              })),
            }))
          }
          onVoteAvailability={(_, optionId) =>
            setGroup((previousGroup) => ({
              ...previousGroup,
              availabilityOptions: (
                previousGroup.availabilityOptions ?? []
              ).map((option) => ({
                ...option,
                voterUserIds: option.id === optionId ? ['community-user'] : [],
              })),
            }))
          }
          strings={{ common: translations.common }}
        />
      );
    };

    render(<Wrapper />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Assign role: Community User' })
    );
    expect(
      screen.getByRole('button', { name: 'Remove role: Community User' })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Event title'), {
      target: { value: 'Planning Night' },
    });
    fireEvent.change(screen.getByLabelText('Event description'), {
      target: { value: 'Plan the next meetup.' },
    });
    fireEvent.change(screen.getByLabelText('Event location'), {
      target: { value: 'Portland' },
    });
    fireEvent.change(screen.getByLabelText('Starts at'), {
      target: { value: '2026-04-25T18:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Schedule event' }));
    expect(screen.getByText('Planning Night')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Availability options'), {
      target: { value: 'Saturday morning, Sunday afternoon' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Save availability options' })
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Vote' })[0]);
    expect(screen.getByText('Saturday morning (1)')).toBeInTheDocument();
  });

  test('GroupDetail disables group interaction controls when activation is still pending', () => {
    const translations = fetchTranslations();

    render(
      <GroupDetail
        group={baseGroup}
        language="en"
        joined={false}
        isAdmin={true}
        currentUserId="community-user"
        onJoinToggle={() => undefined}
        onBack={() => undefined}
        onAssignRole={() => undefined}
        onRemoveRole={() => undefined}
        onScheduleEvent={() => undefined}
        onRespondToEvent={() => undefined}
        onSetAvailabilityOptions={() => undefined}
        onVoteAvailability={() => undefined}
        strings={{ common: translations.common }}
        interactionGate={{
          isLocked: true,
          message: 'Complete your profile to interact with people and groups.',
        }}
      />
    );

    expect(
      screen.getByText(/Complete your profile to interact/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Schedule event' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Save availability options' })
    ).toBeDisabled();
  });
});
