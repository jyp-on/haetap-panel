import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { Config, ServiceState } from './types';

export const ipc = {
  loadConfig: () => invoke<Config>('load_config'),
  saveConfig: (config: Config) => invoke<void>('save_config', { config }),
  startService: (serviceId: string, command: string, cwd: string) =>
    invoke<number>('start_service', { serviceId, command, cwd }),
  stopService: (serviceId: string) =>
    invoke<boolean>('stop_service', { serviceId }),
  listRunning: () => invoke<Record<string, number>>('list_running'),
};

export function onLog(serviceId: string, handler: (line: string) => void): Promise<UnlistenFn> {
  return listen<string>(`log:${serviceId}`, (e) => handler(e.payload));
}

export function onState(serviceId: string, handler: (state: ServiceState) => void): Promise<UnlistenFn> {
  return listen<any>(`state:${serviceId}`, (e) => {
    const raw = e.payload;
    if (raw.status === 'crashed') {
      handler({ status: 'crashed', exitCode: raw.exitCode ?? raw.exit_code, at: raw.at });
    } else if (raw.status === 'running') {
      handler({ status: 'running', pid: raw.pid, startedAt: raw.startedAt ?? raw.started_at });
    } else {
      handler(raw as ServiceState);
    }
  });
}
