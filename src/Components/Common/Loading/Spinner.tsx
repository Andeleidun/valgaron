import CircularProgress from '@mui/material/CircularProgress';
import { Box } from '..';

const spinnerSx = {
  display: 'flex',
  inset: 0,
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
};

function Spinner() {
  return (
    <Box sx={spinnerSx}>
      <CircularProgress />
    </Box>
  );
}

export default Spinner;
