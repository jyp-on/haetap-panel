import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useStore } from './store';
import { ipc } from './ipc';
import { Sidebar } from './components/Sidebar';
import { ServiceList } from './components/ServiceList';
import { PinnedLogs } from './components/PinnedLogs';

export default function App() {
  const setProjects = useStore((s) => s.setProjects);
  const setServices = useStore((s) => s.setServices);

  useEffect(() => {
    ipc.loadConfig().then((cfg) => {
      setProjects(cfg.projects);
      setServices(cfg.services);
    }).catch(console.error);
  }, [setProjects, setServices]);

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
