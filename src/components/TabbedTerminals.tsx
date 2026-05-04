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
      <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-end',
        minHeight: 38,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        overflowX: 'auto',
        px: 0.5,
        pt: 0.5,
      }}>
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
                height: 32,
                cursor: 'pointer',
                bgcolor: active ? 'background.default' : 'transparent',
                borderRadius: '6px 6px 0 0',
                borderTop: active ? '1px solid' : '1px solid transparent',
                borderLeft: active ? '1px solid' : '1px solid transparent',
                borderRight: active ? '1px solid' : '1px solid transparent',
                borderColor: active ? 'divider' : 'transparent',
                marginRight: 0.25,
                marginBottom: '-1px',
                position: 'relative',
                minWidth: 140,
                maxWidth: 240,
                userSelect: 'none',
                color: active ? 'text.primary' : 'text.secondary',
                transition: 'background-color 120ms ease, color 120ms ease',
                '&:hover': { color: 'text.primary', bgcolor: active ? 'background.default' : '#2a2a2e' },
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor(id), flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 400,
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
                  sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>

      {/* 모든 열린 탭 마운트 (활성만 보임) */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative', bgcolor: 'background.default' }}>
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
