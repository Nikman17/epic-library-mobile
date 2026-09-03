import { useState, useEffect, useMemo } from 'react';
import { LibraryGame } from '@/lib/epic';
import { GameMeta, resizedImageUrl } from '@/lib/epicMeta';
// MUI
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import VideogameAsset from '@mui/icons-material/VideogameAsset';

const IMAGE_TIMEOUT_MS = 30000; // generous timeout for slow mobile networks

interface GameCardProps {
  game: LibraryGame;
  meta?: GameMeta;
  resolving: boolean;
  onClick: () => void;
  onTagClick?: (tag: string) => void;
}

function GameCard({ game, meta, resolving, onClick, onTagClick }: GameCardProps) {
  // srcIndex 0: resized CDN url, 1: raw url, 2: give up
  const [srcIndex, setSrcIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const sources = useMemo(() => {
    if (!meta?.imageUrl) return [];
    const resized = resizedImageUrl(meta.imageUrl);
    return resized !== meta.imageUrl ? [resized, meta.imageUrl] : [meta.imageUrl];
  }, [meta?.imageUrl]);

  const src = srcIndex < sources.length ? sources[srcIndex] : undefined;
  const gaveUp = sources.length > 0 && srcIndex >= sources.length;

  useEffect(() => {
    setSrcIndex(0);
    setLoaded(false);
  }, [meta?.imageUrl]);

  // If an image hangs for too long, fall through to the next source / placeholder.
  useEffect(() => {
    if (!src || loaded) return;
    const timer = setTimeout(() => setSrcIndex((i) => i + 1), IMAGE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [src, loaded]);

  const tags = (meta?.tags || []).slice(0, 3);
  const showPlaceholder = gaveUp || (!src && !resolving);
  const showSkeleton = !showPlaceholder && !loaded;

  return (
    <Card
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.15s',
        '&:active': { transform: 'scale(0.97)' },
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', bgcolor: 'action.hover' }}>
        {src && (
          <Box
            component="img"
            src={src}
            alt={game.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setSrcIndex((i) => i + 1)}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.25s',
            }}
          />
        )}
        {showSkeleton && (
          <Skeleton variant="rectangular" animation="wave" sx={{ position: 'absolute', inset: 0, height: '100%' }} />
        )}
        {showPlaceholder && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.disabled',
            }}
          >
            <VideogameAsset sx={{ fontSize: 40 }} />
          </Box>
        )}
      </Box>

      <Box sx={{ p: 1, pt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.5em',
          }}
        >
          {game.title}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 20 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onClick={onTagClick ? (e) => { e.stopPropagation(); onTagClick(tag); } : undefined}
              sx={{ height: 20, fontSize: 10, '& .MuiChip-label': { px: 0.75 } }}
            />
          ))}
          {!tags.length && resolving && <Skeleton variant="rounded" width={64} height={20} />}
        </Box>
      </Box>
    </Card>
  );
}

export default GameCard;
