import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack,
} from '@mui/material';
import type { Service } from '../types';

type Props = {
  open: boolean;
  initial?: Service;
  projectId: string;
  onClose: () => void;
  onSubmit: (data: Omit<Service, 'id'> & { id?: string }) => void;
};

export function ServiceFormModal({ open, initial, projectId, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [cwd, setCwd] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setCommand(initial?.command ?? '');
      setCwd(initial?.cwd ?? '');
    }
  }, [open, initial]);

  const submit = () => {
    if (!name.trim() || !command.trim() || !cwd.trim()) return;
    onSubmit({
      id: initial?.id,
      projectId,
      name: name.trim(),
      command: command.trim(),
      cwd: cwd.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? '서비스 편집' : '서비스 추가'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <TextField
            label="명령"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="./api.sh"
          />
          <TextField
            label="작업 디렉토리 (cwd)"
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="/Users/jyp-mac/develop/haetap/incubody"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={submit}>
          {initial ? '저장' : '추가'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
