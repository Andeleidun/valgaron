import { Link as RouterLink, useLocation } from 'react-router-dom';
import { PageType } from '../../types';
import { Button, Container, Grid, GridItem } from '../';
import './Nav.css';
import { useAuth } from '../../Utlilities/auth/AuthContext';

/**
 * Props for Nav.
 */
type Props = {
  pages: PageType[];
};

/**
 * Renders bottom navigation for the app pages.
 */
function Nav({ pages }: Props) {
  const location = useLocation();
  const { status } = useAuth();
  const canNavigate = status === 'signed_in';
  return (
    <Container className="who-nav" component="nav">
      <Grid className="who-nav-menu" component="menu">
        {pages.map((page) => {
          const active =
            page.path === '/'
              ? location.pathname === '/'
              : location.pathname === page.path ||
                location.pathname.startsWith(`${page.path}/`);
          const navButtonClass = `who-nav-button ${active ? 'active' : ''}`;
          return (
            <GridItem key={page.id} className="who-nav-item" xs={3}>
              {canNavigate ? (
                <RouterLink
                  className={navButtonClass}
                  to={page.path}
                  aria-current={active ? 'page' : undefined}
                >
                  {page.icon}
                  {page.title}
                </RouterLink>
              ) : (
                <Button className={navButtonClass} disabled>
                  {page.icon}
                  {page.title}
                </Button>
              )}
            </GridItem>
          );
        })}
      </Grid>
    </Container>
  );
}

export default Nav;
