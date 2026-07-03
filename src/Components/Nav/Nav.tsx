import type { ReactNode } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Container, Grid, GridItem } from '../';
import './Nav.css';

type NavPage = {
  id: string;
  title: string;
  path: string;
  icon?: ReactNode;
};

/**
 * Props for Nav.
 */
type Props = {
  pages: NavPage[];
};

/**
 * Renders bottom navigation for the app pages.
 */
function Nav({ pages }: Props) {
  const location = useLocation();
  return (
    <Container className="vwb-nav" component="nav">
      <Grid className="vwb-nav-menu" component="menu">
        {pages.map((page) => {
          const active =
            page.path === '/'
              ? location.pathname === '/'
              : location.pathname === page.path ||
                location.pathname.startsWith(`${page.path}/`);
          const navButtonClass = `vwb-nav-button ${active ? 'active' : ''}`;
          return (
            <GridItem key={page.id} className="vwb-nav-item" xs={3}>
              <RouterLink
                className={navButtonClass}
                to={page.path}
                aria-current={active ? 'page' : undefined}
              >
                {page.icon}
                {page.title}
              </RouterLink>
            </GridItem>
          );
        })}
      </Grid>
    </Container>
  );
}

export default Nav;
