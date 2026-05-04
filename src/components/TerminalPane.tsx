import { useEffect, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useStore } from '../store';
import { ipc, onPtyData } from '../ipc';

type Props = { serviceId: string };

export function TerminalPane({ serviceId }: Props) {
  const services = useStore((s) => s.services);
  const togglePin = useStore((s) => s.togglePin);
  const service = services.find((s) => s.id === serviceId);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontFamily: 'Menlo, monospace',
      fontSize: 12,
      theme: { background: '#0e0e0e', foreground: '#e0e0e0' },
      scrollback: 5000,
      convertEol: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);

    // PTY 바이트 → 터미널
    const unlistenPromise = onPtyData(serviceId, (bytes) => {
      term.write(bytes);
    });

    // 터미널 키스트로크 → PTY stdin
    const onDataDisp = term.onData((data) => {
      ipc.sendInput(serviceId, data).catch(console.error);
    });

    // 컨테이너 resize → fit + IPC resize
    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
        ipc.resizePty(serviceId, term.cols, term.rows).catch(() => {
          /* 자식 안 떠 있으면 실패 OK */
        });
      } catch {
        /* ignore */
      }
    });
    ro.observe(containerRef.current);

    // 첫 프레임 후 한 번 더 fit (마운트 직후 컨테이너 크기 안정화)
    queueMicrotask(() => {
      try {
        fit.fit();
        ipc.resizePty(serviceId, term.cols, term.rows).catch(() => {});
      } catch {
        /* ignore */
      }
    });

    return () => {
      ro.disconnect();
      onDataDisp.dispose();
      unlistenPromise.then((un) => un()).catch(() => {});
      term.dispose();
    };
  }, [serviceId]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="overline" sx={{ flex: 1 }}>
          {service?.name ?? serviceId}
        </Typography>
        <IconButton size="small" onClick={() => togglePin(serviceId)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box ref={containerRef} sx={{ flex: 1, minHeight: 0, bgcolor: '#0e0e0e' }} />
    </Box>
  );
}
