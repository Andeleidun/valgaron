import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PeopleCard from '../../Common/Card/PeopleCard/PeopleCard';
import { datingProfileData } from '../../../Utlilities/data';
import { fetchTranslations } from '../../../Utlilities';
import { flushReactEffects, runWithReactAct } from '../../../test/reactAct';

describe('Discovery CTAs and empty states', () => {
  test('Like action shows UI feedback on PeopleCard', async () => {
    const translations = fetchTranslations();
    const profile = datingProfileData[0];
    render(
      <PeopleCard
        profile={profile}
        mode={{ id: 'dating' }}
        like={() => undefined}
        message={() => undefined}
        language="en"
        strings={{ profile: translations.profile, common: translations.common }}
      />
    );
    await flushReactEffects();

    await runWithReactAct(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Like' }));
    });
    await flushReactEffects();
    expect(screen.getByRole('button', { name: 'Liked' })).toBeInTheDocument();
  });

  test('Message action shows UI feedback on PeopleCard', async () => {
    const translations = fetchTranslations();
    const profile = datingProfileData[0];
    render(
      <PeopleCard
        profile={profile}
        mode={{ id: 'dating' }}
        like={() => undefined}
        message={() => undefined}
        language="en"
        strings={{ profile: translations.profile, common: translations.common }}
      />
    );
    await flushReactEffects();

    await runWithReactAct(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Message' }));
    });
    await flushReactEffects();
    expect(screen.getByRole('button', { name: 'Sent' })).toBeInTheDocument();
  });
});
