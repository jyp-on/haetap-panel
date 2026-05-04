import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
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

  const browseFolder = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        defaultPath: cwd || undefined,
      });
      if (typeof selected === 'string' && selected.length > 0) {
        setCwd(selected);
      }
    } catch (e) {
      console.error('폴더 선택 실패', e);
    }
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
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Finder에서 폴더 선택">
                      <IconButton size="small" onClick={browseFolder} edge="end">
                        <FolderOpenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
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
