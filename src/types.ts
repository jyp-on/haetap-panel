export type Project = {
  id: string;
  name: string;
};

export type Service = {
  id: string;
  projectId: string;
  name: string;
  command: string;
  cwd: string;
};

export type ServiceState =
  | { status: 'stopped' }
  | { status: 'starting' }
  | { status: 'running'; pid: number; startedAt: number }
  | { status: 'stopping' }
  | { status: 'crashed'; exitCode: number; at: number };

export type Config = {
  version: number;
  projects: Project[];
  services: Service[];
};
