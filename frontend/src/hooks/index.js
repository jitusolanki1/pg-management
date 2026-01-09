/**
 * React Query Hooks - Central Export
 * All data fetching hooks in one place
 */

// Query Keys
export { queryKeys } from "./queryKeys";

// Dashboard
export { useDashboardStats } from "./useDashboard";

// Floors
export {
  useFloors,
  useFloor,
  useCreateFloor,
  useUpdateFloor,
  useDeleteFloor,
} from "./useFloors";

// Rooms
export {
  useRooms,
  useRoomsByFloor,
  useRoom,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "./useRooms";

// Beds
export {
  useBeds,
  useAvailableBeds,
  useBedsByRoom,
  useBedsByFloor,
  useBed,
  usePrefetchBeds,
} from "./useBeds";

// Tenants
export {
  useTenants,
  useActiveTenants,
  useTenant,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  usePrefetchTenant,
} from "./useTenants";

// Payments
export {
  usePayments,
  usePaidPayments,
  useUnpaidPayments,
  usePaymentsByTenant,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from "./usePayments";

// Plans
export {
  usePlans,
  useInitializePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
} from "./usePlans";
