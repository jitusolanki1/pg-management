/**
 * Query Keys
 * Centralized query key management for React Query
 * Using factory pattern for type-safe and consistent keys
 */

export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ["dashboard"],
    stats: () => [...queryKeys.dashboard.all, "stats"],
  },

  // Floors
  floors: {
    all: ["floors"],
    lists: () => [...queryKeys.floors.all, "list"],
    list: (filters) => [...queryKeys.floors.lists(), filters],
    details: () => [...queryKeys.floors.all, "detail"],
    detail: (id) => [...queryKeys.floors.details(), id],
  },

  // Rooms
  rooms: {
    all: ["rooms"],
    lists: () => [...queryKeys.rooms.all, "list"],
    list: (filters) => [...queryKeys.rooms.lists(), filters],
    details: () => [...queryKeys.rooms.all, "detail"],
    detail: (id) => [...queryKeys.rooms.details(), id],
    byFloor: (floorId) => [...queryKeys.rooms.all, "byFloor", floorId],
  },

  // Beds
  beds: {
    all: ["beds"],
    lists: () => [...queryKeys.beds.all, "list"],
    list: (filters) => [...queryKeys.beds.lists(), filters],
    details: () => [...queryKeys.beds.all, "detail"],
    detail: (id) => [...queryKeys.beds.details(), id],
    available: () => [...queryKeys.beds.all, "available"],
    byRoom: (roomId) => [...queryKeys.beds.all, "byRoom", roomId],
    byFloor: (floorId) => [...queryKeys.beds.all, "byFloor", floorId],
  },

  // Tenants
  tenants: {
    all: ["tenants"],
    lists: () => [...queryKeys.tenants.all, "list"],
    list: (filters) => [...queryKeys.tenants.lists(), filters],
    details: () => [...queryKeys.tenants.all, "detail"],
    detail: (id) => [...queryKeys.tenants.details(), id],
    active: () => [...queryKeys.tenants.all, "active"],
  },

  // Payments
  payments: {
    all: ["payments"],
    lists: () => [...queryKeys.payments.all, "list"],
    list: (filters) => [...queryKeys.payments.lists(), filters],
    paid: () => [...queryKeys.payments.all, "paid"],
    unpaid: () => [...queryKeys.payments.all, "unpaid"],
    byTenant: (tenantId) => [...queryKeys.payments.all, "byTenant", tenantId],
  },

  // Plans
  plans: {
    all: ["plans"],
    list: () => [...queryKeys.plans.all, "list"],
  },
};
