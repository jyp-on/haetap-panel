import { create } from 'zustand';
import type { Project, Service, ServiceState } from './types';

type State = {
  projects: Project[];
  services: Service[];
  selectedProjectId: string | null;
  states: Record<string, ServiceState>;
  pinnedIds: string[];
};

type Actions = {
  setProjects: (p: Project[]) => void;
  setServices: (s: Service[]) => void;
  selectProject: (id: string | null) => void;
  upsertProject: (p: Project) => void;
  removeProject: (id: string) => void;
  upsertService: (s: Service) => void;
  removeService: (id: string) => void;
  setState: (serviceId: string, state: ServiceState) => void;
  togglePin: (serviceId: string) => void;
};

export const useStore = create<State & Actions>((set) => ({
  projects: [],
  services: [],
  selectedProjectId: null,
  states: {},
  pinnedIds: [],

  setProjects: (projects) => set({ projects }),
  setServices: (services) => set({ services }),
  selectProject: (id) => set({ selectedProjectId: id }),
  upsertProject: (p) =>
    set((s) => ({
      projects: s.projects.find((x) => x.id === p.id)
        ? s.projects.map((x) => (x.id === p.id ? p : x))
        : [...s.projects, p],
    })),
  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      services: s.services.filter((sv) => sv.projectId !== id),
      selectedProjectId: s.selectedProjectId === id ? null : s.selectedProjectId,
    })),
  upsertService: (sv) =>
    set((s) => ({
      services: s.services.find((x) => x.id === sv.id)
        ? s.services.map((x) => (x.id === sv.id ? sv : x))
        : [...s.services, sv],
    })),
  removeService: (id) =>
    set((s) => ({
      services: s.services.filter((x) => x.id !== id),
      pinnedIds: s.pinnedIds.filter((p) => p !== id),
    })),
  setState: (serviceId, state) =>
    set((s) => ({ states: { ...s.states, [serviceId]: state } })),
  togglePin: (serviceId) =>
    set((s) => ({
      pinnedIds: s.pinnedIds.includes(serviceId)
        ? s.pinnedIds.filter((x) => x !== serviceId)
        : [...s.pinnedIds, serviceId],
    })),
}));
