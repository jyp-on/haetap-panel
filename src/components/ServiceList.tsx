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

  const list = services.filter((s) => s.projectId === selectedId);
  const projectName = projects.find((p) => p.id === selectedId)?.name ?? '';

  const persist = () => {
    const all = useStore.getState();
    ipc.saveConfig({ version: 1, projects: all.projects, services: all.services });
  };

  const onSubmit = (data: Omit<Service, 'id'> & { id?: string }) => {
    const sv: Service = { ...data, id: data.id ?? uuid() };
    upsertService(sv);
    persist();
  };

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{projectName}</Typography>
        <Stack direction="row" spacing={1}>
          {/* Start All / Stop All는 Task 11에서 추가 */}
        </Stack>
      </Stack>
      <Stack spacing={1}>
        {list.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
            state={states[s.id] ?? { status: 'stopped' }}
            pinned={pinnedIds.includes(s.id)}
            onStart={() => { /* Task 9에서 IPC 연결 */ }}
            onStop={() => { /* Task 9에서 IPC 연결 */ }}
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
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
