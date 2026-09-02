import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage and window in node test environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const k of Object.keys(store)) delete store[k];
  }),
};

// @ts-expect-error Mocking global localStorage
globalThis.localStorage = localStorageMock;
// @ts-expect-error Mocking global window
globalThis.window = {
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

import {
  enqueueOfflineMutation,
  getOfflineQueue,
  removeOfflineMutation,
  clearSyncedMutations,
  setCachedSnapshot,
  getCachedSnapshot,
} from "./offline-sync";

describe("offline-sync library", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("enqueues a mutation into local storage queue", () => {
    const mutation = enqueueOfflineMutation("CREATE_ORDER", {
      orderType: "TAKEAWAY",
      items: [{ menuItemId: "item-1", quantity: 2 }],
    });

    expect(mutation.id).toBeDefined();
    expect(mutation.actionType).toBe("CREATE_ORDER");
    expect(mutation.createdAt).toBeGreaterThan(0);

    const queue = getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(mutation.id);
  });

  it("removes an individual mutation upon sync", () => {
    const m1 = enqueueOfflineMutation("CREATE_ORDER", { id: 1 });
    const m2 = enqueueOfflineMutation("ADD_ITEMS", { id: 2 });

    expect(getOfflineQueue()).toHaveLength(2);

    removeOfflineMutation(m1.id);

    const remaining = getOfflineQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(m2.id);
  });

  it("clears multiple synced mutations at once and purges local storage", () => {
    const m1 = enqueueOfflineMutation("CREATE_ORDER", { id: 1 });
    const m2 = enqueueOfflineMutation("CREATE_ORDER", { id: 2 });
    const m3 = enqueueOfflineMutation("CREATE_ORDER", { id: 3 });

    clearSyncedMutations([m1.id, m2.id]);

    const remaining = getOfflineQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(m3.id);

    clearSyncedMutations([m3.id]);
    expect(getOfflineQueue()).toHaveLength(0);
    expect(localStorageMock.getItem("adisyonex_offline_queue_v1")).toBeNull();
  });

  it("caches and retrieves lightweight snapshots safely", () => {
    const mockMenu = { categories: [{ id: "cat-1", name: "İçecekler" }] };
    setCachedSnapshot("menu", mockMenu);

    const cached = getCachedSnapshot<typeof mockMenu>("menu");
    expect(cached).toEqual(mockMenu);

    expect(getCachedSnapshot("non_existent")).toBeNull();
  });
});
