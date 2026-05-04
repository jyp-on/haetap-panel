import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useStore } from './store';
import { ipc, onLog, onState } from './ipc';
import { Sidebar } from './components/Sidebar';
import { ServiceList } from './components/ServiceList';
import { PinnedLogs } from './components/PinnedLogs';
import type { UnlistenFn } from '@tauri-apps/api/event';

export default function App() {
  const setProjects = useStore((s) => s.setProjects);
  const setServices = useStore((s) => s.setServices);
  const services = useStore((s) => s.services);
  const setState = useStore((s) => s.setState);
  const appendLog = useStore((s) => s.appendLog);
  const unlistenRef = useRef<Map<string, UnlistenFn[]>>(new Map());

  // Initial config load
  useEffect(() => {
    ipc.loadConfig()
      .then((cfg) => {
        setProjects(cfg.projects);
        setServices(cfg.services);
      })
      .catch(console.error);
  }, [setProjects, setServices]);

  // Sync log/state listeners to the current service list (no cleanup return)
  useEffect(() => {
    const map = unlistenRef.current;
    const currentIds = new Set(services.map((s) => s.id));

    // Unregister listeners for services that disappeared
    for (const [id, fns] of Array.from(map.entries())) {
      if (!currentIds.has(id)) {
        fns.forEach((f) => f());
        map.delete(id);
      }
    }

    // Register listeners for newly added services
    services.forEach((s) => {
      if (!map.has(s.id)) {
        Promise.all([
          onLog(s.id, (line) => appendLog(s.id, line)),
          onState(s.id, (state) => setState(s.id, state)),
        ]).then((fns) => map.set(s.id, fns));
      }
    });
  }, [services, appendLog, setState]);

  // Unmount cleanup: detach all listeners exactly once
  useEffect(() => {
    return () => {
      const map = unlistenRef.current;
      for (const fns of map.values()) fns.forEach((f) => f());
      map.clear();
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <ServiceList />
        </Box>
        <Box sx={{ flex: 1, borderTop: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <PinnedLogs />
        </Box>
      </Box>
    </Box>
  );
}
