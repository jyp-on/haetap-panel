import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Autocomplete,
} from '@mui/material';
import { ipc } from '../ipc';
import type { Service } from '../types';

type Props = {
  open: boolean;
  initial?: Service;
  projectId: string;
  cwd: string;
  onClose: () => void;
  onSubmit: (data: Omit<Service, 'id'> & { id?: string }) => void;
};

export function ServiceFormModal({ open, initial, projectId, cwd, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [scripts, setScripts] = useState<string[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setCommand(initial?.command ?? '');
      setScripts([]);
      setScanError(null);
      ipc.listScripts(cwd)
        .then((s) => {
          setScripts(s);
          setScanError(null);
        })
        .catch((err) => {
          setScripts([]);
          setScanError(String(err));
        });
    }
  }, [open, initial, cwd]);

  const submit = () => {
    if (!name.trim() || !command.trim()) return;
    onSubmit({
      id: initial?.id,
      projectId,
      name: name.trim(),
      command: command.trim(),
    });
    onClose();
  };

  const helperText = scanError
    ? `(디렉토리 읽기 실패: ${cwd})`
    : scripts.length === 0
      ? `(이 디렉토리 하위에 *.sh 파일 없음)`
      : `${scripts.length}개의 *.sh 파일 발견`;

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
            helperText={cwd}
          />
          <Autocomplete
            options={scripts}
            value={null}
            blurOnSelect
            clearOnBlur
            onChange={(_, value) => {
              if (value) setCommand(`./${value}`);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="이 프로젝트의 스크립트 (검색 가능)"
                size="small"
                helperText={helperText}
              />
            )}
            disabled={scripts.length === 0 && !scanError}
            noOptionsText="일치하는 스크립트 없음"
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
