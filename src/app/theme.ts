import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#0b6bcb',
        },
        secondary: {
          main: '#ff8a00',
        },
        background: {
          default: '#eef6ff',
          paper: '#ffffff',
        },
      },
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
  },
});
