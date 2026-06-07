import { startTransition, useState, type MouseEvent } from 'react';
import { capitalizeFirstLetter } from '../../Utlilities/strings';
import { ModeType, HeaderStringsType } from '../../types';
import { Button, Container, Title } from '../Common';
import ModeMenu from './ModeMenu';
import SettingsMenu from './SettingsMenu';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import AppBar from '@mui/material/AppBar';
import Drawer from '@mui/material/Drawer';
import Popover from '@mui/material/Popover';
import { useTheme } from '@mui/material/styles';
import './Header.scss';

type Props = {
  mode: ModeType;
  modes: ModeType[];
  setMode: (mode: ModeType) => void;
  strings: HeaderStringsType;
  language: string;
  setLanguage: (l: string) => void;
  toggleDarkMode: () => void;
};

function Header({
  mode,
  modes,
  setMode,
  strings,
  language,
  setLanguage,
  toggleDarkMode,
}: Props) {
  const theme = useTheme();
  const [modeMenuAnchor, setModeMenuAnchor] =
    useState<HTMLButtonElement | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const showModeMenu = Boolean(modeMenuAnchor);
  const appName = strings.appName[language] ?? strings.appName.en ?? '';
  const currentModeLabel = capitalizeFirstLetter(
    strings.modes[mode.id].title[language] ?? strings.modes[mode.id].title.en
  );
  const modeMenuLabel =
    strings.accessibility.modeMenu[language] ??
    strings.accessibility.modeMenu.en ??
    '';
  const settingsMenuLabel =
    strings.accessibility.settingsMenu[language] ??
    strings.accessibility.settingsMenu.en ??
    '';
  const openModeMenuLabel =
    strings.accessibility.openModeMenu[language] ??
    strings.accessibility.openModeMenu.en ??
    '';
  const closeModeMenuLabel =
    strings.accessibility.closeModeMenu[language] ??
    strings.accessibility.closeModeMenu.en ??
    '';
  const openSettingsMenuLabel =
    strings.accessibility.openSettingsMenu[language] ??
    strings.accessibility.openSettingsMenu.en ??
    '';
  const closeSettingsMenuLabel =
    strings.accessibility.closeSettingsMenu[language] ??
    strings.accessibility.closeSettingsMenu.en ??
    '';
  const modeMenuId = 'who-mode-drawer';
  const settingsMenuId = 'who-settings-drawer';
  const portalThemeClassName = `${
    theme.palette.mode === 'dark' ? 'dark-theme' : 'light-theme'
  } ${mode.id}-theme`;

  const toggleShowModeMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setModeMenuAnchor((currentValue) => {
      if (currentValue) {
        return null;
      }
      setShowSettingsMenu(false);
      return event.currentTarget;
    });
  };
  const toggleShowSettingsMenu = () => {
    setShowSettingsMenu((currentValue) => {
      const nextValue = !currentValue;
      if (nextValue) {
        setModeMenuAnchor(null);
      }
      return nextValue;
    });
  };
  const closeModeMenu = () => setModeMenuAnchor(null);
  const closeSettingsMenu = () => setShowSettingsMenu(false);

  const handleModeClick = (m: ModeType) => {
    closeModeMenu();
    startTransition(() => {
      setMode(m);
    });
  };
  return (
    <AppBar
      className="who-header"
      position="fixed"
      sx={{ bgcolor: 'primary.surfaceStrong' }}
      enableColorOnDark
    >
      <Container className="who-header-shell">
        <Button
          onClick={toggleShowModeMenu}
          className="who-header-toggle-button who-mode-toggle-button"
          sx={{ bgcolor: 'primary.surfaceTone' }}
          aria-label={showModeMenu ? closeModeMenuLabel : openModeMenuLabel}
          aria-controls={showModeMenu ? modeMenuId : undefined}
          aria-expanded={showModeMenu}
          aria-haspopup="dialog"
        >
          {showModeMenu ? <MenuOpenIcon /> : <MenuIcon />}
          <span className="who-header-toggle-label">{modeMenuLabel}</span>
        </Button>
        <Title className="who-title" component="h1">
          <span className="who-title-main">{appName}</span>{' '}
          <span className={`who-title-mode ${mode.id}-title`}>
            {currentModeLabel}
          </span>
        </Title>
        <Button
          onClick={toggleShowSettingsMenu}
          className="who-header-toggle-button who-settings-toggle-button"
          sx={{ bgcolor: 'primary.surfaceTone' }}
          aria-label={
            showSettingsMenu ? closeSettingsMenuLabel : openSettingsMenuLabel
          }
          aria-controls={showSettingsMenu ? settingsMenuId : undefined}
          aria-expanded={showSettingsMenu}
          aria-haspopup="dialog"
        >
          {showSettingsMenu ? <SettingsApplicationsIcon /> : <SettingsIcon />}
          <span className="who-header-toggle-label">{settingsMenuLabel}</span>
        </Button>
      </Container>
      <Popover
        open={showModeMenu}
        anchorEl={modeMenuAnchor}
        onClose={closeModeMenu}
        disableScrollLock
        transitionDuration={{ enter: 120, exit: 80 }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          id: modeMenuId,
          className: `who-header-popover-paper ${portalThemeClassName}`,
        }}
      >
        <ModeMenu
          mode={mode}
          modes={modes}
          strings={strings.modes}
          language={language}
          handleModeClick={handleModeClick}
          title={modeMenuLabel}
        />
      </Popover>
      <Drawer
        anchor="right"
        open={showSettingsMenu}
        onClose={closeSettingsMenu}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          id: settingsMenuId,
          className: `who-header-drawer-paper ${portalThemeClassName}`,
        }}
      >
        <SettingsMenu
          language={language}
          toggleDarkMode={toggleDarkMode}
          setLanguage={setLanguage}
          strings={strings.settings}
          title={settingsMenuLabel}
        />
      </Drawer>
    </AppBar>
  );
}

export default Header;
