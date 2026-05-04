import { useState } from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { v4 as uuid } from 'uuid';
import { useStore } from '../store';
import { ipc } from '../ipc';
import { ServiceCard } from './ServiceCard';
import { ServiceFormModal } from './ServiceFormModal';
import type { Service } from '../types';

export function ServiceList() {
  const selectedId = useStore((s) => s.selectedProjectId);
  const projects = useStore((s) => s.projects);
  const services = useStore((s) => s.services);
  const states = useStore((s) => s.states);
  const pinnedIds = useStore((s) => s.pinnedIds);
  const upsertService = useStore((s) => s.upsertService);
  const removeService = useStore((s) => s.removeService);
  const togglePin = useStore((s) => s.togglePin);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | undefined>();

  if (!selectedId) {
    return <Typography color="text.secondary">왼쪽에서 프로젝트를 선택하세요.</Typography>;
  }

  const selectedProject = projects.find((p) => p.id === selectedId);
  if (!selectedProject) return null;

  const list = services.filter((s) => s.projectId === selectedId);
  const cwd = selectedProject.cwd;

  const persist = () => {
    const all = useStore.getState();
    ipc.saveConfig({ version: 1, projects: all.projects, services: all.services });
  };

  const onSubmit = (data: Omit<Service, 'id'> & { id?: string }) => {
    const sv: Service = { ...data, id: data.id ?? uuid() };
    upsertService(sv);
    persist();
  };

  const startOne = async (sv: Service) => {
    if (!cwd) {
      console.error(`[${sv.name}] 프로젝트의 작업 디렉토리(cwd)가 비어있습니다.`);
      useStore.getState().setState(sv.id, { status: 'crashed', exitCode: -1, at: Date.now() });
      return;
    }
    useStore.getState().setState(sv.id, { status: 'starting' });
    try {
      const pid = await ipc.startService(sv.id, sv.command, cwd);
      useStore.getState().setState(sv.id, { status: 'running', pid, startedAt: Date.now() });
    } catch (e) {
      useStore.getState().setState(sv.id, { status: 'crashed', exitCode: -1, at: Date.now() });
      console.error(`[${sv.name}]`, e);
    }
  };

  const stopOne = async (sv: Service) => {
    useStore.getState().setState(sv.id, { status: 'stopping' });
    try {
      await ipc.stopService(sv.id);
    } catch (e) {
      console.error(`[${sv.name}]`, e);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{selectedProject.name}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined" size="small" color="primary"
            onClick={async () => {
              const targets = list.filter((sv) => {
                const st = states[sv.id]?.status ?? 'stopped';
                return st !== 'running' && st !== 'starting';
              });
              await Promise.all(targets.map(startOne));
            }}
          >
            Start All
          </Button>
          <Button
            variant="outlined" size="small" color="warning"
            onClick={async () => {
              const targets = list.filter((sv) => states[sv.id]?.status === 'running');
              await Promise.all(targets.map(stopOne));
            }}
          >
            Stop All
          </Button>
        </Stack>
      </Stack>
      <Stack spacing={1}>
        {list.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
            state={states[s.id] ?? { status: 'stopped' }}
            pinned={pinnedIds.includes(s.id)}
            onStart={() => startOne(s)}
            onStop={() => stopOne(s)}
            onPin={() => togglePin(s.id)}
            onEdit={() => { setEditing(s); setModalOpen(true); }}
            onDelete={() => { removeService(s.id); persist(); }}
          />
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
          sx={{ alignSelf: 'flex-start' }}
        >
          서비스 추가
        </Button>
      </Stack>
      <ServiceFormModal
        open={modalOpen}
        initial={editing}
        projectId={selectedId}
        cwd={cwd}
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
