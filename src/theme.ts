import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a48bf2', light: '#b9a3ff', dark: '#8a6ef0', contrastText: '#0f0f10' },
    success: { main: '#5fd97f' },
    warning: { main: '#f6c463' },
    error: { main: '#ef6b6b' },
    background: {
      default: '#1a1a1c',
      paper: '#26262a',
    },
    divider: '#33333a',
    text: {
      primary: '#e6e6e6',
      secondary: '#9b9ba3',
      disabled: '#6e6e76',
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    fontSize: 13,
    body1: { letterSpacing: '0.01em' },
    body2: { letterSpacing: '0.01em' },
    caption: { fontSize: 11.5, color: '#9b9ba3' },
    h6: { fontSize: 15, fontWeight: 600, letterSpacing: '0.01em' },
    overline: { fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, paddingInline: 12, minWidth: 0 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        sizeSmall: { padding: 4 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          marginInline: 6,
          marginBlock: 1,
          '&.Mui-selected': {
            backgroundColor: '#2e2e34',
          },
          '&.Mui-selected:hover': {
            backgroundColor: '#34343a',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#26262a',
          borderRadius: 12,
          border: '1px solid #33333a',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#33333a' },
      },
    },
  },
});
