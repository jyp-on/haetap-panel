import { useState } from 'react';
import {
  Box, List, ListItemButton, ListItemText, IconButton,
  Typography, Badge, Menu, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { v4 as uuid } from 'uuid';
import { useStore } from '../store';
import { ipc } from '../ipc';
import { ProjectFormModal } from './ProjectFormModal';
import type { Project } from '../types';

export function Sidebar() {
  const projects = useStore((s) => s.projects);
  const services = useStore((s) => s.services);
  const states = useStore((s) => s.states);
  const selectedId = useStore((s) => s.selectedProjectId);
  const selectProject = useStore((s) => s.selectProject);
  const upsertProject = useStore((s) => s.upsertProject);
  const removeProject = useStore((s) => s.removeProject);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuTarget, setMenuTarget] = useState<Project | null>(null);

  const runningCount = (projectId: string) =>
    services
      .filter((s) => s.projectId === projectId)
      .filter((s) => states[s.id]?.status === 'running').length;

  const persist = () => {
    const all = useStore.getState();
    ipc.saveConfig({ version: 1, projects: all.projects, services: all.services });
  };

  const onSubmit = (data: Omit<Project, 'id'> & { id?: string }) => {
    const p: Project = { ...data, id: data.id ?? uuid() };
    upsertProject(p);
    persist();
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setModalOpen(true);
    setMenuAnchor(null);
  };

  const onDelete = (p: Project) => {
    if (window.confirm(`프로젝트 "${p.name}"과(와) 그 안의 모든 서비스를 삭제할까요?`)) {
      removeProject(p.id);
      persist();
    }
    setMenuAnchor(null);
  };

  return (
    <Box sx={{ width: 240, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
        <Typography variant="overline">Projects</Typography>
        <IconButton size="small" onClick={() => { setEditing(undefined); setModalOpen(true); }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
      <List dense sx={{ flex: 1, overflow: 'auto' }}>
        {projects.map((p) => (
          <ListItemButton
            key={p.id}
            selected={p.id === selectedId}
            onClick={() => selectProject(p.id)}
            sx={{ pr: 1 }}
          >
            <ListItemText
              primary={p.name}
              secondary={p.cwd}
              slotProps={{
                secondary: {
                  sx: { fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                },
              }}
            />
            <Badge color="primary" badgeContent={runningCount(p.id)} sx={{ mr: 1 }} />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
                setMenuTarget(p);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
        ))}
      </List>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => menuTarget && openEdit(menuTarget)}>편집</MenuItem>
        <MenuItem onClick={() => menuTarget && onDelete(menuTarget)}>삭제</MenuItem>
      </Menu>
      <ProjectFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
