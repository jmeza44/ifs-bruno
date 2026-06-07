import { Store, useStore } from "@tanstack/react-store";
import type { CollectionEntry, IfsProjection } from "@/lib/types";
import type { ProfileOption } from "@/components/workspace/profile-selector";
import type { LoadedSpec } from "@/components/workspace/spec-loader";
import type { EndpointListEntry } from "@/components/workspace/endpoint-list-panel";
import type { EndpointDetail } from "@/components/workspace/endpoint-detail-panel";
import type { PendingConfirmation } from "@/components/workspace/confirmation-dialog";

export type ProjectionSource =
  | { type: "none" }
  | {
      type: "profile";
      profile: ProfileOption;
      projection: { state: "searching" } | { state: "resolved"; projection: IfsProjection };
    }
  | { type: "spec"; spec: LoadedSpec; projection: IfsProjection };

export type WorkspaceState = {
  collection: {
    active: CollectionEntry | null;
    available: CollectionEntry[];
  };
  profiles: {
    available: ProfileOption[];
  };
  source: ProjectionSource;
  endpoints: {
    available: EndpointListEntry[];
    alreadyInCollection: Set<string>;
    selectedToAdd: Set<string>;
    detail: EndpointDetail | null;
  };
  ui: {
    pendingConfirmation: PendingConfirmation | null;
  };
};

const initialState: WorkspaceState = {
  collection: { active: null, available: [] },
  profiles: { available: [] },
  source: { type: "none" },
  endpoints: {
    available: [],
    alreadyInCollection: new Set(),
    selectedToAdd: new Set(),
    detail: null,
  },
  ui: { pendingConfirmation: null },
};

export const workspaceStore = new Store<WorkspaceState>(initialState);

function isDirty(state: WorkspaceState): boolean {
  return state.endpoints.selectedToAdd.size > 0;
}

function resetEndpoints(): WorkspaceState["endpoints"] {
  return {
    available: [],
    alreadyInCollection: new Set(),
    selectedToAdd: new Set(),
    detail: null,
  };
}

export const workspaceActions = {
  setAvailableCollections(collections: CollectionEntry[]) {
    workspaceStore.setState((state) => {
      const active = state.collection.active
        ? (collections.find((entry) => entry.path === state.collection.active!.path) ?? state.collection.active)
        : null;
      return { ...state, collection: { active, available: collections } };
    });
  },

  setAvailableProfiles(profiles: ProfileOption[]) {
    workspaceStore.setState((state) => ({
      ...state,
      profiles: { available: profiles },
    }));
  },

  selectCollection(collection: CollectionEntry) {
    workspaceStore.setState((state) => {
      if (state.collection.active?.path === collection.path) return state;
      if (!isDirty(state)) {
        return {
          ...state,
          collection: { ...state.collection, active: collection },
          endpoints: resetEndpoints(),
        };
      }
      return {
        ...state,
        ui: { pendingConfirmation: { type: "switch-collection", target: collection } },
      };
    });
  },

  createCollection(collection: CollectionEntry) {
    workspaceStore.setState((state) => {
      const available = [...state.collection.available, collection];
      if (!isDirty(state)) {
        return {
          ...state,
          collection: { active: collection, available },
          endpoints: resetEndpoints(),
        };
      }
      return {
        ...state,
        collection: { ...state.collection, available },
        ui: { pendingConfirmation: { type: "create-collection-and-move", created: collection } },
      };
    });
  },

  selectProfile(profile: ProfileOption) {
    workspaceStore.setState((state) => {
      const isSameProfile = state.source.type === "profile" && state.source.profile.id === profile.id;
      if (isSameProfile) return state;

      if (!isDirty(state)) {
        return { ...state, source: { type: "profile", profile, projection: { state: "searching" } }, endpoints: resetEndpoints() };
      }
      return { ...state, ui: { pendingConfirmation: { type: "switch-profile", target: profile } } };
    });
  },

  addProfile(profile: ProfileOption) {
    workspaceStore.setState((state) => ({
      ...state,
      profiles: { available: [...state.profiles.available, profile] },
    }));
  },

  deleteProfile(profile: ProfileOption) {
    workspaceStore.setState((state) => {
      const isActive = state.source.type === "profile" && state.source.profile.id === profile.id;
      if (isActive) {
        return { ...state, ui: { pendingConfirmation: { type: "delete-active-profile", target: profile } } };
      }
      return {
        ...state,
        profiles: { available: state.profiles.available.filter((p) => p.id !== profile.id) },
      };
    });
  },

  loadSpec(spec: LoadedSpec, projection: IfsProjection, endpoints: EndpointListEntry[]) {
    workspaceStore.setState((state) => {
      const hasProgress = state.source.type !== "none" || isDirty(state);
      if (!hasProgress) {
        return {
          ...state,
          source: { type: "spec", spec, projection },
          endpoints: { ...resetEndpoints(), available: endpoints },
        };
      }
      return { ...state, ui: { pendingConfirmation: { type: "switch-source", target: "spec" } } };
    });
  },

  selectProjection(projection: IfsProjection, endpoints: EndpointListEntry[], alreadyInCollection: Set<string>) {
    workspaceStore.setState((state) => {
      if (state.source.type !== "profile") return state;
      return {
        ...state,
        source: { ...state.source, projection: { state: "resolved", projection } },
        endpoints: { ...resetEndpoints(), available: endpoints, alreadyInCollection },
      };
    });
  },

  closeProjection() {
    workspaceStore.setState((state) => {
      if (state.source.type === "profile") {
        return {
          ...state,
          source: { ...state.source, projection: { state: "searching" } },
          endpoints: resetEndpoints(),
        };
      }
      return { ...state, source: { type: "none" }, endpoints: resetEndpoints() };
    });
  },

  viewEndpointDetail(detail: EndpointDetail | null) {
    workspaceStore.setState((state) => ({ ...state, endpoints: { ...state.endpoints, detail } }));
  },

  toggleEndpointSelection(id: string) {
    workspaceStore.setState((state) => {
      if (state.endpoints.alreadyInCollection.has(id)) return state;
      const selectedToAdd = new Set(state.endpoints.selectedToAdd);
      if (selectedToAdd.has(id)) selectedToAdd.delete(id);
      else selectedToAdd.add(id);
      return { ...state, endpoints: { ...state.endpoints, selectedToAdd } };
    });
  },

  saveSelection() {
    workspaceStore.setState((state) => {
      const alreadyInCollection = new Set(state.endpoints.alreadyInCollection);
      for (const id of state.endpoints.selectedToAdd) alreadyInCollection.add(id);
      return {
        ...state,
        endpoints: { ...state.endpoints, alreadyInCollection, selectedToAdd: new Set() },
      };
    });
  },

  confirmPending() {
    const { ui } = workspaceStore.state;
    const pending = ui.pendingConfirmation;
    if (!pending) return;

    switch (pending.type) {
      case "switch-collection":
        workspaceStore.setState((state) => ({
          ...state,
          collection: { ...state.collection, active: pending.target },
          endpoints: resetEndpoints(),
          ui: { pendingConfirmation: null },
        }));
        return;

      case "create-collection-and-move":
        workspaceStore.setState((state) => ({
          ...state,
          collection: { ...state.collection, active: pending.created },
          endpoints: resetEndpoints(),
          ui: { pendingConfirmation: null },
        }));
        return;

      case "switch-profile":
        workspaceStore.setState((state) => ({
          ...state,
          source: { type: "profile", profile: pending.target, projection: { state: "searching" } },
          endpoints: resetEndpoints(),
          ui: { pendingConfirmation: null },
        }));
        return;

      case "delete-active-profile":
        workspaceStore.setState((state) => ({
          ...state,
          source: { type: "none" },
          endpoints: resetEndpoints(),
          ui: { pendingConfirmation: null },
        }));
        return;

      case "switch-source":
        workspaceStore.setState((state) => ({
          ...state,
          source: { type: "none" },
          endpoints: resetEndpoints(),
          ui: { pendingConfirmation: null },
        }));
        return;
    }
  },

  cancelPending() {
    workspaceStore.setState((state) => ({ ...state, ui: { pendingConfirmation: null } }));
  },
};

export function useWorkspaceStore<T>(selector: (state: WorkspaceState) => T): T {
  return useStore(workspaceStore, selector);
}

export function useIsDirty(): boolean {
  return useWorkspaceStore((state) => state.endpoints.selectedToAdd.size > 0);
}
