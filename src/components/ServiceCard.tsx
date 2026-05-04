import { useState } from 'react';
import {
  Box, Typography, IconButton, Menu, MenuItem, Button,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Service, ServiceState } from '../types';

type Props = {
  service: Service;
  state: ServiceState;
  onStart: () => void;
  onStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ServiceCard({
  service, state, onStart, onStop, onEdit, onDelete,
}: Props) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const isRunning = state.status === 'running';

  const dotColor =
    state.status === 'running' ? 'success.main'
    : state.status === 'crashed' ? 'error.main'
    : state.status === 'starting' || state.status === 'stopping' ? 'warning.main'
    : 'text.disabled';

  const stateLabel =
    state.status === 'running' ? `running · pid ${state.pid}` :
    state.status === 'crashed' ? `crashed (code ${state.exitCode})` :
    state.status;

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 1.5,
      py: 1,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1.25,
      transition: 'background-color 120ms ease, border-color 120ms ease',
      '&:hover': { bgcolor: '#2e2e34' },
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
      <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{service.name}</Typography>
      <Typography variant="caption" sx={{ width: 200, color: 'text.secondary' }}>
        {stateLabel}
      </Typography>
      {isRunning
        ? <Button size="small" color="warning" onClick={onStop}>Stop</Button>
        : <Button size="small" color="primary" onClick={onStart}>Start</Button>}
      <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setMenuAnchor(null); onEdit(); }}>편집</MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); onDelete(); }}>삭제</MenuItem>
      </Menu>
    </Box>
  );
}
