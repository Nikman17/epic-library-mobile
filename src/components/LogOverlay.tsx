import { useState, useEffect, useRef } from 'react';
import { getLogLines, subscribeLogs, clearLogs, setLogsEnabled } from '@/lib/logger';
import { t } from '@/lib/i18n';
// MUI
import Portal from '@mui/material/Portal';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Terminal from '@mui/icons-material/Terminal';
import ContentCopy from '@mui/icons-material/ContentCopy';
import DeleteSweep from '@mui/icons-material/DeleteSweep';
import Close from '@mui/icons-material/Close';

const FAB_Z = 2147483300;
const OVERLAY_Z = 2147483400;

interface LogOverlayProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

function LogOverlay({ enabled, onEnabledChange }: LogOverlayProps) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(() => getLogLines());
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeLogs(setLines), []);

  // Autoscroll to the latest line
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [lines, open]);

  const handleCopy = async () => {
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleEnabled = async (value: boolean) => {
    await setLogsEnabled(value);
    onEnabledChange(value);
    if (!value) setOpen(false);
  };

  if (!enabled) return null;

  return (
    <Portal>
      {!open && (
        <IconButton
          aria-label={t('ariaShowLogs')}
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 16,
            zIndex: FAB_Z,
            bgcolor: 'rgba(0, 0, 0, 0.55)',
            color: '#7fff7f',
            width: 40,
            height: 40,
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.75)' },
          }}
        >
          <Terminal fontSize="small" />
        </IconButton>
      )}

      {open && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: OVERLAY_Z,
            bgcolor: 'rgba(0, 0, 0, 0.92)',
            color: '#7fff7f',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '45vh',
            boxShadow: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <Typography sx={{ flexGrow: 1, fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {t('logsTitle')} ({lines.length})
            </Typography>
            <Switch
              size="small"
              checked={enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              slotProps={{ input: { 'aria-label': t('ariaLogsEnabled') } }}
            />
            <Button
              size="small"
              onClick={handleCopy}
              startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
              sx={{ color: copied ? '#7fff7f' : '#fff', fontSize: 11, minWidth: 0, textTransform: 'none' }}
            >
              {copied ? t('copied') : t('copy')}
            </Button>
            <IconButton size="small" onClick={clearLogs} sx={{ color: '#fff' }} aria-label={t('ariaClearLogs')}>
              <DeleteSweep sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff' }} aria-label={t('ariaCloseLogs')}>
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <Box
            ref={listRef}
            sx={{
              overflowY: 'auto',
              px: 1,
              py: 0.5,
              fontFamily: 'monospace',
              fontSize: 10.5,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {lines.length ? lines.join('\n') : t('logsEmpty')}
          </Box>
        </Box>
      )}
    </Portal>
  );
}

export default LogOverlay;
