import React from 'react';
import { Container, Grid, GridItem } from './';

/**
 * Props for AuthLayout.
 */
type AuthLayoutProps = {
  children: React.ReactNode;
};

/**
 * Renders the public authentication layout without the app shell chrome.
 */
const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <Container component="main" className="who-auth-layout">
      <Grid container alignItems="center" className="who-auth-grid">
        <GridItem xs={12} md={6} className="who-auth-card">
          {children}
        </GridItem>
      </Grid>
    </Container>
  );
};

export default AuthLayout;
