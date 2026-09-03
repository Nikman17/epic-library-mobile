import { useState, useEffect, useMemo, useRef } from "react";
import SnackbarAlert from "./SnackbarAlert";
import GameCard from "./GameCard";
import LogOverlay from "./LogOverlay";
import useIsMobile from '@/hooks/useIsMobile';
import { LibraryGame, getLibrary } from '@/lib/epic';
import { MetaMap, loadMetaMap, needsResolve, resolveMetaQueued, searchUrlFor } from '@/lib/epicMeta';
import { log, logsEnabledItem, setLogsEnabled } from '@/lib/logger';
import { addAllToWishlist } from '@/lib/wishlist';
import { t, tf } from '@/lib/i18n';
// MUI
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Fab from '@mui/material/Fab';
import Portal from '@mui/material/Portal';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import Close from "@mui/icons-material/Close";
import LightMode from "@mui/icons-material/LightMode";
import DarkMode from "@mui/icons-material/DarkMode";
import Refresh from "@mui/icons-material/Refresh";
import Search from "@mui/icons-material/Search";
import Clear from "@mui/icons-material/Clear";
import VideogameAsset from "@mui/icons-material/VideogameAsset";
import SportsEsports from "@mui/icons-material/SportsEsports";
import Settings from "@mui/icons-material/Settings";
import MoreVert from "@mui/icons-material/MoreVert";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import Terminal from "@mui/icons-material/Terminal";
import StopCircle from "@mui/icons-material/StopCircle";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const PAGE_SIZE = 10;
const FAB_Z = 2147482000;

type SortBy = "purchase" | "name" | "price" | "release";

interface Alert {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
  loadingIcon?: boolean;
}

function formatAge(fetchedAt: number): string {
  if (!fetchedAt) return '';
  const mins = Math.floor((Date.now() - fetchedAt) / 60000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return tf('minAgo', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return tf('hoursAgo', { n: hours });
  return tf('daysAgo', { n: Math.floor(hours / 24) });
}

function GamesDialog() {
  const [open, setOpen] = useState(false);
  const [games, setGames] = useState<LibraryGame[]>([]);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>("purchase");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [metaMap, setMetaMap] = useState<MetaMap>({});
  const [resolvingKeys, setResolvingKeys] = useState<Set<string>>(new Set());
  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [logsEnabled, setLogsEnabledState] = useState(true);
  const [wishlistRunning, setWishlistRunning] = useState(false);
  const [wishlistConfirmOpen, setWishlistConfirmOpen] = useState(false);
  const [alert, setAlert] = useState<Alert>({
    open: false,
    message: '',
    severity: 'info',
  });

  const initializedRef = useRef(false);
  const resolvingRef = useRef<Set<string>>(new Set());
  const wishlistStopRef = useRef(false);
  const isMobile = useIsMobile();

  // Initialize dark mode based on system preference
  useEffect(() => {
    if (darkMode === null) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }
  }, [darkMode]);

  useEffect(() => {
    loadMetaMap().then((m) => setMetaMap({ ...m }));
    logsEnabledItem.getValue().then(setLogsEnabledState);
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
        },
        // Epic pages use high z-index layers; keep our UI on top of everything.
        zIndex: {
          modal: 2147482500,
          snackbar: 2147483200,
          tooltip: 2147483250,
        },
      }),
    [darkMode],
  );

  const loadLibrary = async (force: boolean) => {
    setLoading(true);
    try {
      const res = await getLibrary(force);
      setGames(res.games);
      setFetchedAt(res.fetchedAt);
      if (res.warning) {
        setAlert({ open: true, message: tf('cacheWarn', { n: res.games.length, err: res.warning }), severity: "warning" });
      }
      else if (!res.fromCache) {
        setAlert({ open: true, message: tf('loadedMsg', { n: res.games.length }), severity: "success" });
      }
    }
    catch (error) {
      console.error("Failed to load library:", error);
      log('Library load failed: ' + String(error));
      setAlert({
        open: true,
        message: error instanceof Error ? error.message : t('loadFailed'),
        severity: "error",
      });
    }
    finally {
      setLoading(false);
    }
  };

  const refreshGames = async () => {
    setAlert({ open: true, message: t('refreshingMsg'), severity: "info", loadingIcon: true });
    setSearchTerm("");
    setPage(0);
    await loadLibrary(true);
  };

  // Auto-load the library (from 24h cache when fresh) on first open
  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true;
      loadLibrary(false);
    }
  }, [open]);

  // Toggle via Alt+G on desktop
  useEffect(() => {
    const messageListener = (message: { type: string }) => {
      if (message.type === "toggleDialog") {
        setOpen((prevOpen: boolean) => !prevOpen);
      }
    };

    browser.runtime.onMessage.addListener(messageListener);

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    }
  }, []);

  // --- Filtering / sorting / pagination ---

  const filteredGames = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return games.filter((g) => {
      if (q && !(g.title.toLowerCase().includes(q) || g.rawTitle.toLowerCase().includes(q))) return false;
      if (tagFilter.length) {
        const tags = metaMap[g.key]?.tags || [];
        if (!tagFilter.some((t) => tags.includes(t))) return false;
      }
      return true;
    });
  }, [games, searchTerm, tagFilter, metaMap]);

  const sortedGames = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredGames].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return dir * a.title.localeCompare(b.title);
        case "price":
          return dir * (a.price - b.price);
        case "release": {
          const ar = metaMap[a.key]?.releaseDateMillis;
          const br = metaMap[b.key]?.releaseDateMillis;
          if (ar == null && br == null) return 0;
          if (ar == null) return 1; // unknown release dates go last
          if (br == null) return -1;
          return dir * (ar - br);
        }
        default:
          return dir * (a.purchaseDateMillis - b.purchaseDateMillis);
      }
    });
  }, [filteredGames, sortBy, sortDir, metaMap]);

  const pageCount = Math.max(1, Math.ceil(sortedGames.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
  }, [pageCount, page]);

  const pagedGames = useMemo(
    () => sortedGames.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [sortedGames, page],
  );

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of games) {
      for (const t of metaMap[g.key]?.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([t]) => t);
  }, [games, metaMap]);

  // Lazily resolve covers/links/tags for the visible page while cards show placeholders
  useEffect(() => {
    if (!open) return;
    for (const g of pagedGames) {
      if (!needsResolve(metaMap[g.key]) || resolvingRef.current.has(g.key)) continue;
      resolvingRef.current.add(g.key);
      setResolvingKeys(new Set(resolvingRef.current));
      resolveMetaQueued(g.key, g.title)
        .then((meta) => setMetaMap((prev) => ({ ...prev, [g.key]: meta })))
        .catch((e) => log(`Meta resolve error for "${g.title}": ${String(e)}`))
        .finally(() => {
          resolvingRef.current.delete(g.key);
          setResolvingKeys(new Set(resolvingRef.current));
        });
    }
  }, [open, pagedGames, metaMap]);

  // --- Handlers ---

  const handleCardClick = (game: LibraryGame) => {
    const url = metaMap[game.key]?.productUrl || searchUrlFor(game.title);
    window.open(url, '_blank');
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    setPage(0);
  };

  const handleTagSelectChange = (e: SelectChangeEvent<string[]>) => {
    const v = e.target.value;
    setTagFilter(typeof v === 'string' ? v.split(',') : v);
    setPage(0);
  };

  const handleSettings = () => {
    setMenuAnchor(null);
    browser.runtime.sendMessage({ type: "openSettings" }).catch((e) => log('openSettings failed: ' + String(e)));
  };

  const handleToggleLogs = async () => {
    setMenuAnchor(null);
    const next = !logsEnabled;
    await setLogsEnabled(next);
    setLogsEnabledState(next);
  };

  const startWishlist = async () => {
    setWishlistConfirmOpen(false);
    wishlistStopRef.current = false;
    setWishlistRunning(true);
    log(`Wishlist run started for ${games.length} games`);
    try {
      const result = await addAllToWishlist(
        games,
        (p) => setAlert({
          open: true,
          message: tf('wishlistProgress', { done: p.done, total: p.total, added: p.added, skipped: p.skipped, failed: p.failed }),
          severity: "info",
          loadingIcon: true,
        }),
        () => wishlistStopRef.current,
      );
      setAlert({
        open: true,
        message: tf('wishlistDone', { added: result.added, skipped: result.skipped, failed: result.failed }),
        severity: result.failed ? "warning" : "success",
      });
    }
    catch (error) {
      setAlert({
        open: true,
        message: t('wishlistPrefix') + (error instanceof Error ? error.message : String(error)),
        severity: "error",
      });
    }
    finally {
      setWishlistRunning(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (darkMode === null) {
    return null; // Don't render until we know the theme preference
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Floating touch button — the mobile entry point (replaces Alt+G) */}
      <Portal>
        {!open && (
          <Fab
            variant="extended"
            color="primary"
            size="medium"
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 16,
              zIndex: FAB_Z,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            <SportsEsports sx={{ mr: 1 }} />
            {t('fabLabel')}
          </Fab>
        )}
      </Portal>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          paper: {
            sx: {
              // On mobile let the fullScreen paper track the real viewport;
              // an explicit 100vh overflows and clips the toolbar and pager.
              height: isMobile ? "100%" : "85vh",
              maxHeight: isMobile ? "100%" : "85vh",
              position: "relative",
            }
          },
        }}
      >
        <Box
          component="header"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            bgcolor: "background.paper",
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 52 }, px: { xs: 1.5 } }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" component="div" noWrap sx={{ fontSize: { xs: 16, sm: 20 }, lineHeight: 1.2 }}>
                {t('appTitle')}
              </Typography>
              {!!fetchedAt && (
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {tf('updated', { age: formatAge(fetchedAt) })}
                </Typography>
              )}
            </Box>

            <IconButton color="inherit" onClick={refreshGames} disabled={loading} aria-label={t('ariaRefresh')}>
              <Refresh />
            </IconButton>

            <IconButton color="inherit" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label={t('ariaMenu')}>
              <MoreVert />
            </IconButton>

            <IconButton color="inherit" onClick={handleClose} aria-label={t('ariaClose')}>
              <Close />
            </IconButton>
          </Toolbar>
        </Box>

        <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
          {wishlistRunning ? (
            <MenuItem onClick={() => { wishlistStopRef.current = true; setMenuAnchor(null); }}>
              <ListItemIcon><StopCircle fontSize="small" /></ListItemIcon>
              <ListItemText>{t('menuStopWishlist')}</ListItemText>
            </MenuItem>
          ) : (
            <MenuItem disabled={!games.length} onClick={() => { setMenuAnchor(null); setWishlistConfirmOpen(true); }}>
              <ListItemIcon><FavoriteBorder fontSize="small" /></ListItemIcon>
              <ListItemText>{t('menuWishlist')}</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleToggleLogs}>
            <ListItemIcon><Terminal fontSize="small" /></ListItemIcon>
            <ListItemText>{logsEnabled ? t('menuLogsOff') : t('menuLogsOn')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setDarkMode(!darkMode); setMenuAnchor(null); }}>
            <ListItemIcon>{darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}</ListItemIcon>
            <ListItemText>{darkMode ? t('menuLightTheme') : t('menuDarkTheme')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSettings}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            <ListItemText>{t('menuSettings')}</ListItemText>
          </MenuItem>
        </Menu>

        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}>
          {!games.length ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              flex={1}
              gap={3}
              p={3}
            >
              {loading ? (
                <>
                  <CircularProgress />
                  <Typography variant="body1" color="text.secondary">
                    {t('loadingLib')}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    {t('emptyTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
                    {t('emptyText')}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => loadLibrary(true)}
                    startIcon={<VideogameAsset />}
                    size="large"
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {t('loadBtn')}
                  </Button>
                </>
              )}
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
              <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(0)
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => { setSearchTerm(""); setPage(0); }} aria-label={t('ariaClearSearch')}>
                            <Clear fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : undefined,
                    }
                  }}
                />
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <FormControl size="small" sx={{ minWidth: 138, flexShrink: 0 }}>
                    <InputLabel>{t('sortLabel')}</InputLabel>
                    <Select
                      value={sortBy}
                      label={t('sortLabel')}
                      onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(0); }}
                    >
                      <MenuItem value="purchase">{t('sortPurchase')}</MenuItem>
                      <MenuItem value="name">{t('sortName')}</MenuItem>
                      <MenuItem value="price">{t('sortPrice')}</MenuItem>
                      <MenuItem value="release">{t('sortRelease')}</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    size="small"
                    onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                    aria-label={t('ariaSortDir')}
                  >
                    {sortDir === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                  </IconButton>
                  <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
                    <InputLabel>{t('tagsLabel')}</InputLabel>
                    <Select
                      multiple
                      value={tagFilter}
                      label={t('tagsLabel')}
                      onChange={handleTagSelectChange}
                      renderValue={(selected) => (selected as string[]).join(', ')}
                      disabled={!allTags.length && !tagFilter.length}
                    >
                      {allTags.map((tag) => (
                        <MenuItem key={tag} value={tag} dense>
                          <Checkbox checked={tagFilter.includes(tag)} size="small" sx={{ p: 0.5, mr: 0.5 }} />
                          <ListItemText primary={tag} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflowY: "auto", p: 1.25, minHeight: 0 }}>
                {pagedGames.length ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                        md: "repeat(4, 1fr)",
                        lg: "repeat(5, 1fr)",
                      },
                      gap: 1.25,
                    }}
                  >
                    {pagedGames.map((game) => (
                      <GameCard
                        key={game.key}
                        game={game}
                        meta={metaMap[game.key]}
                        resolving={resolvingKeys.has(game.key)}
                        onClick={() => handleCardClick(game)}
                        onTagClick={toggleTagFilter}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box display="flex" flexDirection="column" alignItems="center" gap={2} pt={6}>
                    <Typography color="text.secondary">{t('nothingFound')}</Typography>
                    <Button size="small" onClick={() => { setSearchTerm(""); setTagFilter([]); setPage(0); }}>
                      {t('resetFilters')}
                    </Button>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  pt: 0.5,
                  pb: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
                  borderTop: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <IconButton
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  size="large"
                  aria-label={t('ariaPrevPage')}
                >
                  <ChevronLeft />
                </IconButton>
                <Typography sx={{ fontSize: 13, minWidth: 120, textAlign: "center" }}>
                  {page + 1} / {pageCount} · {tf('gamesCount', { n: sortedGames.length })}
                </Typography>
                <IconButton
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  size="large"
                  aria-label={t('ariaNextPage')}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>
          )}
          <SnackbarAlert
            open={alert.open}
            severity={alert.severity}
            message={alert.message}
            loadingIcon={alert.loadingIcon}
            onClose={handleCloseAlert}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={wishlistConfirmOpen} onClose={() => setWishlistConfirmOpen(false)}>
        <DialogTitle sx={{ fontSize: 17 }}>{t('wishlistConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {tf('wishlistConfirmText', { n: games.length })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWishlistConfirmOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={startWishlist} startIcon={<FavoriteBorder />}>
            {t('add')}
          </Button>
        </DialogActions>
      </Dialog>

      <LogOverlay enabled={logsEnabled} onEnabledChange={setLogsEnabledState} />
    </ThemeProvider>
  )
}

export default GamesDialog
