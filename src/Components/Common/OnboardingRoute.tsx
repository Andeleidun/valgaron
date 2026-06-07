import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ModeType } from '../../types';
import { UserContext } from '../../Utlilities/user';
import {
  getOnboardingPath,
  isModeOnboardingComplete,
} from '../../Utlilities/onboarding';

type OnboardingRouteProps = {
  children: React.ReactElement;
  mode: ModeType;
};

/**
 * Redirect users toward balanced onboarding before protected mode surfaces are
 * available.
 */
const OnboardingRoute = ({ children, mode }: OnboardingRouteProps) => {
  const { user } = useContext(UserContext);
  const location = useLocation();

  if (isModeOnboardingComplete({ user, modeId: mode.id })) {
    return children;
  }

  return (
    <Navigate to={getOnboardingPath()} replace state={{ from: location }} />
  );
};

export default OnboardingRoute;
