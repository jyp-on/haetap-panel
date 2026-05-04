import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack,
} from '@mui/material';
import type { Project } from '../types';

type Props = {
  open: boolean;
  initial?: Project;
  onClose: () => void;
  onSubmit: (data: Omit<Project, 'id'> & { id?: string }) => void;
};

export function ProjectFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [cwd, setCwd] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setCwd(initial?.cwd ?? '');
    }
  }, [open, initial]);

  const submit = () => {
    if (!name.trim() || !cwd.trim()) return;
    onSubmit({
      id: initial?.id,
      name: name.trim(),
      cwd: cwd.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? '프로젝트 편집' : '프로젝트 추가'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
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
