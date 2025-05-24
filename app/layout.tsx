'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const inter = Inter({ subsets: ['latin'] });

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      dark: '#42a5f5',
      light: '#bbdefb',
    },
    secondary: {
      main: '#ce93d8',
      dark: '#ab47bc',
      light: '#e1bee7',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    success: {
      main: '#66bb6a',
      dark: '#388e3c',
      light: '#a5d6a7',
    },
    error: {
      main: '#f44336',
      dark: '#d32f2f',
      light: '#ef5350',
    },
    warning: {
      main: '#ffa726',
      dark: '#f57c00',
      light: '#ffcc02',
    },
    info: {
      main: '#29b6f6',
      dark: '#0288d1',
      light: '#4fc3f7',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#333',
          color: '#ffffff',
        },
      },
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Hooman Labs Dashboard</title>
        <meta name="description" content="Hooman Labs Dashboard" />
      </head>
      <body className={inter.className}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {children}
          </LocalizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 