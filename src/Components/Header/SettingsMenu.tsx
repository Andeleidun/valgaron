import { Box, ToggleButton, Button, Grid, GridItem, Text } from '../Common';
import { languages } from '../../Utlilities';
import { useTheme } from '@mui/material/styles';
import { SettingsStringsType } from '../../types';
import { useAuth } from '../../Utlilities/auth/AuthContext';

/**
 * Props for SettingsMenu.
 */
type Props = {
  language: string;
  setLanguage: (l: string) => void;
  toggleDarkMode: () => void;
  strings: SettingsStringsType;
  title?: string;
};

/**
 * Renders the settings menu for language and theme.
 */
function SettingsMenu({
  language,
  setLanguage,
  toggleDarkMode,
  strings,
  title = '',
}: Props) {
  const theme = useTheme();
  const { status, signOut } = useAuth();
  const isDarkMode = theme.palette.mode === 'dark';
  const canSignOut = status === 'signed_in';
  return (
    <Box className="who-header-panel" component="section">
      {title ? (
        <Text className="who-header-panel-title" variant="h6" component="h2">
          {title}
        </Text>
      ) : null}
      <Grid
        className="who-header-menu settings-menu fade-in"
        component="menu"
        direction="column"
        spacing={2}
      >
        {languages.map((l) => (
          <GridItem
            key={l}
            className="who-header-menu-item"
            component="li"
            xs={12}
          >
            <Button
              className="who-header-menu-button"
              onClick={() => setLanguage(l)}
              sx={{
                bgcolor:
                  l === language
                    ? 'secondary.surfaceStrong'
                    : 'primary.surfaceStrong',
              }}
            >
              {strings.languages[l][language]}
            </Button>
          </GridItem>
        ))}
        <GridItem
          key="dark-mode"
          className="who-header-menu-item"
          component="li"
          xs={12}
        >
          <ToggleButton
            value={isDarkMode}
            id="dark-mode"
            label={strings.darkMode.on[language]}
            onClick={toggleDarkMode}
            className=""
            sx={{
              bgcolor: 'primary.surfaceStrong',
              color: 'primary.contrastText',
            }}
          />
        </GridItem>
        <GridItem
          key="sign-out"
          className="who-header-menu-item"
          component="li"
          xs={12}
        >
          <Button
            className="who-header-menu-button"
            onClick={signOut}
            disabled={!canSignOut}
            sx={{
              bgcolor: 'primary.surfaceStrong',
              color: 'primary.contrastText',
            }}
          >
            {strings.signOut[language]}
          </Button>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default SettingsMenu;
