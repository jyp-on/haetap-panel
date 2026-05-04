import { useState } from 'react';
import {
  Box, List, ListItemButton, ListItemText, IconButton,
  TextField, Typography, Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { v4 as uuid } from 'uuid';
import { useStore } from '../store';
import { ipc } from '../ipc';

export function Sidebar() {
  const projects = useStore((s) => s.projects);
  const services = useStore((s) => s.services);
  const states = useStore((s) => s.states);
  const selectedId = useStore((s) => s.selectedProjectId);
  const selectProject = useStore((s) => s.selectProject);
  const upsertProject = useStore((s) => s.upsertProject);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const runningCount = (projectId: string) =>
    services
      .filter((s) => s.projectId === projectId)
      .filter((s) => states[s.id]?.status === 'running').length;

  const persist = () => {
    const all = useStore.getState();
    ipc.saveConfig({ version: 1, projects: all.projects, services: all.services });
  };

  const addProject = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setAdding(false);
      setName('');
      return;
    }
    const p = { id: uuid(), name: trimmed };
    upsertProject(p);
    setName('');
    setAdding(false);
    persist();
  };

  return (
    <Box sx={{ width: 220, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
        <Typography variant="overline">Projects</Typography>
        <IconButton size="small" onClick={() => setAdding(true)}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
      <List dense sx={{ flex: 1, overflow: 'auto' }}>
        {projects.map((p) => (
          <ListItemButton key={p.id} selected={p.id === selectedId} onClick={() => selectProject(p.id)}>
            <ListItemText primary={p.name} />
            <Badge color="primary" badgeContent={runningCount(p.id)} />
          </ListItemButton>
        ))}
        {adding && (
          <Box sx={{ p: 1 }}>
            <TextField
              size="small"
              autoFocus
              fullWidth
              placeholder="프로젝트 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addProject();
                if (e.key === 'Escape') { setAdding(false); setName(''); }
              }}
              onBlur={addProject}
            />
          </Box>
        )}
      </List>
    </Box>
  );
}
