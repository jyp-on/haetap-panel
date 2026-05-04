import { create } from 'zustand';
import type { Project, Service, ServiceState } from './types';

type State = {
  projects: Project[];
  services: Service[];
  selectedProjectId: string | null;
  states: Record<string, ServiceState>;
  openTabIds: string[];      // 탭으로 열린 서비스 id, 삽입 순서 = 탭 순서
  activeTabId: string | null; // 현재 활성 탭
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
  openTab: (serviceId: string) => void;
  closeTab: (serviceId: string) => void;
  setActiveTab: (serviceId: string | null) => void;
};

export const useStore = create<State & Actions>((set) => ({
  projects: [],
  services: [],
  selectedProjectId: null,
  states: {},
  openTabIds: [],
  activeTabId: null,

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
      // 해당 프로젝트 소속 서비스의 탭도 닫기
      openTabIds: s.openTabIds.filter((tid) => {
        const sv = s.services.find((x) => x.id === tid);
        return sv && sv.projectId !== id;
      }),
      activeTabId:
        s.activeTabId &&
        s.services.find((x) => x.id === s.activeTabId)?.projectId === id
          ? null
          : s.activeTabId,
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
      openTabIds: s.openTabIds.filter((tid) => tid !== id),
      activeTabId: s.activeTabId === id ? null : s.activeTabId,
    })),

  setState: (serviceId, state) =>
    set((s) => ({ states: { ...s.states, [serviceId]: state } })),

  openTab: (serviceId) =>
    set((s) => ({
      openTabIds: s.openTabIds.includes(serviceId)
        ? s.openTabIds
        : [...s.openTabIds, serviceId],
      activeTabId: serviceId,
    })),
  closeTab: (serviceId) =>
    set((s) => {
      const next = s.openTabIds.filter((x) => x !== serviceId);
      let nextActive = s.activeTabId;
      if (s.activeTabId === serviceId) {
        // 닫는 탭이 활성이면 인접 탭 활성, 없으면 null
        const idx = s.openTabIds.indexOf(serviceId);
        nextActive = next[idx] ?? next[idx - 1] ?? null;
      }
      return { openTabIds: next, activeTabId: nextActive };
    }),
  setActiveTab: (serviceId) => set({ activeTabId: serviceId }),
}));
