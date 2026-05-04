import { Typography } from '@mui/material';
import { useStore } from '../store';

export function ServiceList() {
  const selectedId = useStore((s) => s.selectedProjectId);
  if (!selectedId) {
    return <Typography color="text.secondary">왼쪽에서 프로젝트를 선택하세요.</Typography>;
  }
  return <Typography color="text.secondary">서비스 목록 (Task 8에서 구현)</Typography>;
}
