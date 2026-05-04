import { useState } from 'react';
import {
  Box, Typography, IconButton, Menu, MenuItem, Button,
} from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Service, ServiceState } from '../types';

type Props = {
  service: Service;
  state: ServiceState;
  pinned: boolean;
  onStart: () => void;
  onStop: () => void;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ServiceCard({
  service, state, pinned, onStart, onStop, onPin, onEdit, onDelete,
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
      display: 'flex', alignItems: 'center', gap: 1, p: 1,
      border: '1px solid', borderColor: 'divider', borderRadius: 1,
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor }} />
      <Typography sx={{ flex: 1 }}>{service.name}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ width: 200 }}>
        {stateLabel}
      </Typography>
      {isRunning
        ? <Button size="small" color="warning" onClick={onStop}>Stop</Button>
        : <Button size="small" color="primary" onClick={onStart}>Start</Button>}
      <IconButton size="small" onClick={onPin}>
        {pinned
          ? <PushPinIcon fontSize="small" color="primary" />
          : <PushPinOutlinedIcon fontSize="small" />}
      </IconButton>
      <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setMenuAnchor(null); onEdit(); }}>편집</MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); onDelete(); }}>삭제</MenuItem>
      </Menu>
    </Box>
  );
}
