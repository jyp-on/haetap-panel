import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useStore } from '../store';
import { TerminalPane } from './TerminalPane';

export function TabbedTerminals() {
  const services = useStore((s) => s.services);
  const states = useStore((s) => s.states);
  const openTabIds = useStore((s) => s.openTabIds);
  const activeTabId = useStore((s) => s.activeTabId);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const closeTab = useStore((s) => s.closeTab);

  if (openTabIds.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">
          서비스를 시작하면 여기에 터미널이 열립니다.
        </Typography>
      </Box>
    );
  }

  const dotColor = (id: string) => {
    const st = states[id]?.status ?? 'stopped';
    if (st === 'running') return 'success.main';
    if (st === 'crashed') return 'error.main';
    if (st === 'starting' || st === 'stopping') return 'warning.main';
    return 'text.disabled';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 탭 바 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          minHeight: 36,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflowX: 'auto',
        }}
      >
        {openTabIds.map((id) => {
          const sv = services.find((x) => x.id === id);
          if (!sv) return null;
          const active = id === activeTabId;
          return (
            <Box
              key={id}
              onClick={() => setActiveTab(id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                cursor: 'pointer',
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: active ? 'background.default' : 'transparent',
                borderBottom: active ? '2px solid' : '2px solid transparent',
                borderBottomColor: active ? 'primary.main' : 'transparent',
                minWidth: 140,
                maxWidth: 240,
                userSelect: 'none',
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor(id), flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sv.name}
              </Typography>
              <Tooltip title="탭 닫기 (서비스는 계속 실행)">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(id);
                  }}
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>

      {/* 모든 열린 탭의 터미널을 마운트 (활성만 보임) — 스크롤백 보존 */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {openTabIds.map((id) => (
          <Box
            key={id}
            sx={{
              position: 'absolute',
              inset: 0,
              display: id === activeTabId ? 'block' : 'none',
            }}
          >
            <TerminalPane serviceId={id} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
