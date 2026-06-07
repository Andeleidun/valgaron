import React, { useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import type { CommonStringsType } from '../../../types';
import {
  Button,
  Container,
  Grid,
  GridItem,
  Input,
  Text,
  Heading,
} from '../../Common';
import { useAuth } from '../../../Utlilities/auth/AuthContext';

/**
 * Login form values.
 */
type LoginValues = {
  email: string;
  password: string;
  displayName: string;
};

/**
 * Login form validation errors.
 */
type LoginErrors = {
  email: string;
  password: string;
};

/**
 * Location state for login redirect.
 */
type RedirectLocationState = {
  from?: Pick<Location, 'hash' | 'pathname' | 'search'>;
};

/**
 * Supported login actions.
 */
type LoginAction = 'signIn' | 'signUp';

const initialValues: LoginValues = {
  email: '',
  password: '',
  displayName: '',
};

const initialErrors: LoginErrors = {
  email: '',
  password: '',
};

/**
 * Returns the redirect path from location state or the default route.
 */
const getRedirectPath = (state: unknown): string => {
  if (!state || typeof state !== 'object') return '/';
  const candidate = state as RedirectLocationState;
  const pathname = candidate.from?.pathname;
  if (typeof pathname !== 'string' || pathname.length === 0) {
    return '/';
  }
  const search =
    typeof candidate.from?.search === 'string' ? candidate.from.search : '';
  const hash =
    typeof candidate.from?.hash === 'string' ? candidate.from.hash : '';
  return `${pathname}${search}${hash}`;
};

/**
 * Login page with sign-in and sign-up actions.
 */
function Login({
  strings,
  language,
}: {
  strings: CommonStringsType;
  language: string;
}) {
  const { signIn, signUp, status, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState<LoginValues>(initialValues);
  const [errors, setErrors] = useState<LoginErrors>(initialErrors);
  const [action, setAction] = useState<LoginAction>('signIn');
  const isLoading = status === 'loading';

  /**
   * Update form field values from user input.
   */
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (name === 'email' || name === 'password' || name === 'displayName') {
      setValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Validate required login fields.
   */
  const validate = (nextValues: LoginValues): LoginErrors => {
    const nextErrors: LoginErrors = { ...initialErrors };
    if (!nextValues.email.trim()) {
      nextErrors.email = strings.emailRequired?.[language] ?? '';
    }
    if (!nextValues.password.trim()) {
      nextErrors.password = strings.passwordRequired?.[language] ?? '';
    }
    return nextErrors;
  };

  /**
   * Submit the login form based on the requested action.
   */
  const handleSubmit = async (nextAction: LoginAction) => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      return;
    }

    try {
      if (nextAction === 'signIn') {
        await signIn(values.email, values.password);
      } else {
        await signUp(values.email, values.password, values.displayName);
      }
      navigate(getRedirectPath(location.state));
    } catch {
      return;
    }
  };

  /**
   * Trigger the current primary auth action.
   */
  const handlePrimaryAction = () => {
    void handleSubmit(action === 'signUp' ? 'signUp' : 'signIn');
  };

  /**
   * Switch between sign-in and sign-up states.
   */
  const handleSecondaryAction = () => {
    setAction((currentValue) =>
      currentValue === 'signUp' ? 'signIn' : 'signUp'
    );
  };

  const primaryLabel = isLoading
    ? strings.loading?.[language]
    : action === 'signUp'
    ? strings.signUp?.[language]
    : strings.signIn?.[language];
  const secondaryLabel = isLoading
    ? strings.loading?.[language]
    : action === 'signUp'
    ? strings.cancel?.[language]
    : strings.signUp?.[language];

  return (
    <Container className="who-main-login">
      <Container>
        <Heading>{strings.loginTitle?.[language]}</Heading>
      </Container>
      <Grid container>
        {action === 'signUp' ? (
          <GridItem xs={12}>
            <Input
              label={strings.displayName?.[language]}
              name="displayName"
              value={values.displayName}
              handleChange={handleChange}
              fullWidth
              disabled={isLoading}
            />
          </GridItem>
        ) : null}
        <GridItem xs={12}>
          <Input
            label={strings.email?.[language]}
            name="email"
            value={values.email}
            handleChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
            disabled={isLoading}
          />
        </GridItem>
        <GridItem xs={12}>
          <Input
            label={strings.password?.[language]}
            name="password"
            type="password"
            value={values.password}
            handleChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
            fullWidth
            disabled={isLoading}
          />
        </GridItem>
        <GridItem xs={12}>
          <Button onClick={handlePrimaryAction} disabled={isLoading} fullWidth>
            {primaryLabel}
          </Button>
        </GridItem>
        <GridItem xs={12}>
          <Button
            onClick={handleSecondaryAction}
            disabled={isLoading}
            className="secondary"
            fullWidth
          >
            {secondaryLabel}
          </Button>
        </GridItem>
        {error ? (
          <GridItem xs={12}>
            <Text role="alert">{error}</Text>
          </GridItem>
        ) : null}
      </Grid>
    </Container>
  );
}

export default Login;
