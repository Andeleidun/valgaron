import { capitalizeFirstLetter } from '../../Utlilities/strings';
import { ModeType, ModeStringsType } from '../../types';
import { Box, Button, Grid, GridItem, Text } from '../Common';

/**
 * Props for ModeMenu.
 */
type Props = {
  mode: ModeType;
  modes: ModeType[];
  handleModeClick: (mode: ModeType) => void;
  strings: ModeStringsType;
  language: string;
  title?: string;
};

/**
 * Renders the selectable mode menu.
 */
function ModeMenu({
  mode,
  modes,
  strings,
  language,
  handleModeClick,
  title = '',
}: Props) {
  return (
    <Box className="who-header-panel" component="section">
      {title ? (
        <Text className="who-header-panel-title" variant="h6" component="h2">
          {title}
        </Text>
      ) : null}
      <Grid
        className="who-header-menu mode-menu fade-in"
        component="menu"
        direction="column"
        spacing={2}
      >
        {modes.map((m) => (
          <GridItem
            key={m.id}
            className="who-header-menu-item"
            component="li"
            xs={12}
          >
            <Button
              className="who-header-menu-button"
              onClick={() => handleModeClick(m)}
              sx={{
                bgcolor: mode.id === m.id ? 'secondary.main' : 'primary',
              }}
            >
              {capitalizeFirstLetter(strings[m.id].title[language])}
            </Button>
          </GridItem>
        ))}
      </Grid>
    </Box>
  );
}

export default ModeMenu;
