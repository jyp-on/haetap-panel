import { useEffect, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Ansi from 'ansi-to-react';
import { useStore } from '../store';

type Props = { serviceId: string };

export function LogPane({ serviceId }: Props) {
  const lines = useStore((s) => s.logs[serviceId] ?? []);
  const services = useStore((s) => s.services);
  const togglePin = useStore((s) => s.togglePin);
  const service = services.find((s) => s.id === serviceId);
  const ref = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4;
    stickRef.current = atBottom;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', px: 1, py: 0.5,
        bgcolor: 'background.paper',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Typography variant="overline" sx={{ flex: 1 }}>
          📌 {service?.name ?? serviceId}
        </Typography>
        <IconButton size="small" onClick={() => togglePin(serviceId)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box
        ref={ref}
        onScroll={onScroll}
        sx={{
          flex: 1, overflow: 'auto',
          fontFamily: 'Menlo, monospace', fontSize: 12,
          whiteSpace: 'pre', p: 1,
        }}
      >
        {lines.map((line, i) => (
          <div key={i}><Ansi>{line}</Ansi></div>
        ))}
      </Box>
    </Box>
  );
}
