import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c4dff' },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 13,
  },
});
