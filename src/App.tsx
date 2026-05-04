import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useStore } from './store';
import { ipc, onState } from './ipc';
import { Sidebar } from './components/Sidebar';
import { ServiceList } from './components/ServiceList';
import { TabbedTerminals } from './components/TabbedTerminals';
import type { UnlistenFn } from '@tauri-apps/api/event';

export default function App() {
  const setProjects = useStore((s) => s.setProjects);
  const setServices = useStore((s) => s.setServices);
  const services = useStore((s) => s.services);
  const setState = useStore((s) => s.setState);
  const unlistenRef = useRef<Map<string, UnlistenFn>>(new Map());

  // Initial config load
  useEffect(() => {
    ipc.loadConfig()
      .then((cfg) => {
        setProjects(cfg.projects);
        setServices(cfg.services);
      })
      .catch(console.error);
  }, [setProjects, setServices]);

  // Sync state listeners to current service list (log은 TerminalPane이 자체 구독)
  useEffect(() => {
    const map = unlistenRef.current;
    const currentIds = new Set(services.map((s) => s.id));

    for (const [id, fn] of Array.from(map.entries())) {
      if (!currentIds.has(id)) {
        fn();
        map.delete(id);
      }
    }

    services.forEach((s) => {
      if (!map.has(s.id)) {
        onState(s.id, (state) => setState(s.id, state)).then((fn) =>
          map.set(s.id, fn),
        );
      }
    });
  }, [services, setState]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      const map = unlistenRef.current;
      for (const fn of map.values()) fn();
      map.clear();
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
          <ServiceList />
        </Box>
        <Box sx={{ flex: 1, borderTop: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TabbedTerminals />
        </Box>
      </Box>
    </Box>
  );
}
