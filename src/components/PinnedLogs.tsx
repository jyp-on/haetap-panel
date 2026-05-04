import { Box, Typography } from '@mui/material';
import { useStore } from '../store';
import { TerminalPane } from './TerminalPane';

export function PinnedLogs() {
  const pinnedIds = useStore((s) => s.pinnedIds);

  if (pinnedIds.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">핀해서 터미널을 보세요.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {pinnedIds.map((id) => (
        <Box
          key={id}
          sx={{ flex: 1, minHeight: 0, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <TerminalPane serviceId={id} />
        </Box>
      ))}
    </Box>
  );
}
