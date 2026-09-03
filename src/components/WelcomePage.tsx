import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import StoreIcon from '@mui/icons-material/Store';
import LoginIcon from '@mui/icons-material/Login';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CachedIcon from '@mui/icons-material/Cached';
import FilterListIcon from '@mui/icons-material/FilterList';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TerminalIcon from '@mui/icons-material/Terminal';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import GitHubIcon from '@mui/icons-material/GitHub';
import { t } from '@/lib/i18n';

const darkGamingTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00d4ff",
      dark: "#0099cc",
    },
    secondary: {
      main: "#ff6b35",
      dark: "#cc5529",
    },
    background: {
      default: "#0a0e1a",
      paper: "#1a1f2e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b8c4",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: "#00d4ff",
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "linear-gradient(145deg, #1a1f2e 0%, #252b3d 100%)",
          border: "1px solid #2a3441",
        },
      },
    },
  },
});

const AUTHOR_REPO = "https://github.com/Nikman17/epic-library-mobile";

interface Step {
  icon: React.ReactNode;
  color: string;
  title: string;
  text: React.ReactNode;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const steps: Step[] = [
  {
    icon: <StoreIcon />,
    color: "#00d4ff",
    title: t('step1Title'),
    text: (
      <>
        <Link href="https://store.epicgames.com" underline="hover" target="_blank" rel="noopener noreferrer">
          store.epicgames.com
        </Link>
      </>
    ),
  },
  {
    icon: <LoginIcon />,
    color: "#4caf50",
    title: t('step2Title'),
    text: t('step2Text'),
  },
  {
    icon: <TouchAppIcon />,
    color: "#ff6b35",
    title: t('step3Title'),
    text: t('step3Text'),
  },
  {
    icon: <OpenInNewIcon />,
    color: "#9c27b0",
    title: t('step4Title'),
    text: t('step4Text'),
  },
];

const features: Feature[] = [
  { icon: <ViewModuleIcon />, title: t('featCardsTitle'), text: t('featCardsText') },
  { icon: <CachedIcon />, title: t('featCacheTitle'), text: t('featCacheText') },
  { icon: <FilterListIcon />, title: t('featFilterTitle'), text: t('featFilterText') },
  { icon: <FavoriteBorderIcon />, title: t('featWishlistTitle'), text: t('featWishlistText') },
  { icon: <TerminalIcon />, title: t('featLogsTitle'), text: t('featLogsText') },
  { icon: <KeyboardIcon />, title: t('featDesktopTitle'), text: t('featDesktopText') },
];

function getVersion(): string {
  try {
    return browser.runtime.getManifest().version;
  }
  catch {
    return '';
  }
}

export default function WelcomePage() {
  const version = getVersion();

  return (
    <ThemeProvider theme={darkGamingTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #252b3d 100%)",
          py: { xs: 2, sm: 4 },
        }}
      >
        <Container maxWidth="sm">
          <Box textAlign="center" mb={3}>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} mb={1}>
              <Box
                component="img"
                src="/svg-icon.svg"
                alt="Epic Library Mobile icon"
                sx={{ width: 44, height: 44 }}
              />
              <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 26, sm: 32 } }}>
                Epic Library
              </Typography>
            </Box>

            <Box display="flex" justifyContent="center" gap={1} mb={2}>
              <Chip
                label="Mobile"
                size="small"
                sx={{ backgroundColor: "#00d4ff20", color: "#00d4ff", border: "1px solid #00d4ff", fontWeight: 600 }}
              />
              {version && (
                <Chip
                  label={`v${version}`}
                  size="small"
                  sx={{ backgroundColor: "#ff6b3520", color: "#ff6b35", border: "1px solid #ff6b35", fontWeight: 600 }}
                />
              )}
            </Box>

            <Typography variant="body1" color="text.secondary">
              {t('welcomeTagline')}
            </Typography>
          </Box>

          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" component="h2" mb={1.5} color="primary">
              {t('howToUse')}
            </Typography>
            <List disablePadding>
              {steps.map((step, i) => (
                <Box key={i}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 52 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          backgroundColor: `${step.color}20`,
                          border: `2px solid ${step.color}`,
                          color: step.color,
                        }}
                      >
                        {step.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{i + 1}. {step.title}</Typography>}
                      secondary={<Typography variant="body2" color="text.secondary">{step.text}</Typography>}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>

          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" component="h2" mb={1.5} color="primary">
              {t('featuresTitle')}
            </Typography>
            <List disablePadding>
              {features.map((feature, i) => (
                <Box key={feature.title}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters sx={{ py: 1, alignItems: "flex-start" }}>
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5, color: "#00d4ff" }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{feature.title}</Typography>}
                      secondary={<Typography variant="body2" color="text.secondary">{feature.text}</Typography>}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>

          <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: "#d19e08", textAlign: "center", fontWeight: 500 }}>
              {t('disclaimer')}
            </Typography>
          </Paper>

          <Box textAlign="center" pb={2}>
            <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
              <GitHubIcon sx={{ fontSize: 16 }} />
              {t('authorLabel')}{' '}
              <Link href={AUTHOR_REPO} underline="hover" target="_blank" rel="noopener noreferrer">
                <strong>Nikman17</strong>
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  )
}
