import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { ipc, onPtyData, onState } from '../ipc';

type Props = { serviceId: string };

export function TerminalPane({ serviceId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontFamily: 'Menlo, monospace',
      fontSize: 12.5,
      lineHeight: 1.2,
      theme: {
        background: '#0f0f10',
        foreground: '#e6e6e6',
        cursor: '#a48bf2',
        selectionBackground: '#3a3a44',
      },
      scrollback: 5000,
      convertEol: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);

    // PTY 바이트 → 터미널
    const dataPromise = onPtyData(serviceId, (bytes) => {
      term.write(bytes);
    });

    // 시작/재시작 시 화면 초기화 (clean session)
    const statePromise = onState(serviceId, (st) => {
      if (st.status === 'starting' || st.status === 'running') {
        term.reset();
      }
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
      dataPromise.then((un) => un()).catch(() => {});
      statePromise.then((un) => un()).catch(() => {});
      term.dispose();
    };
  }, [serviceId]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: '#0f0f10' }}>
      <Box ref={containerRef} sx={{ flex: 1, minHeight: 0, p: 0.5 }} />
    </Box>
  );
}
