export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SCHEDULER' | 'DEPOT_MANAGER' | 'DRIVER' | 'PASSENGER';

export type BusStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BREAKDOWN';
export type TripStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';
export type FuelType = 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'SPLIT';
export type MaintenanceType = 'ROUTINE' | 'EMERGENCY' | 'INSPECTION' | 'OVERHAUL';
export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' | 'HALF_DAY';
export type NotificationType = 'BUS_DELAY' | 'MAINTENANCE' | 'SHIFT_CHANGE' | 'EMERGENCY' | 'ROUTE_CHANGE' | 'BROADCAST' | 'SYSTEM';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalBuses: number;
  availableBuses: number;
  runningBuses: number;
  inactiveBuses: number;
  driversAvailable: number;
  driversOnDuty: number;
  todaysTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  fuelConsumption: number;
  maintenanceDue: number;
  averageDelay: number;
  occupancyPercentage: number;
}

export interface ScheduleInput {
  date: string;
  depotId?: string;
  routeIds?: string[];
  peakHours: { start: string; end: string }[];
  maxDriverHours: number;
  maxTripsPerBus: number;
  breakDurationMinutes: number;
}

export interface ScheduleOutput {
  id: string;
  date: string;
  trips: ScheduledTrip[];
  metrics: ScheduleMetrics;
}

export interface ScheduledTrip {
  tripNumber: number;
  busId: string;
  driverId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  isReturnTrip: boolean;
  breakAfter: boolean;
}

export interface ScheduleMetrics {
  totalTrips: number;
  busesUsed: number;
  driversUsed: number;
  avgIdleTime: number;
  peakCoverage: number;
  workloadBalance: number;
  fuelEstimate: number;
}

export interface GPSData {
  busId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  currentStop?: string;
  nextStop?: string;
  eta?: number;
  occupancy: number;
  delay: number;
}

export interface DemandPrediction {
  routeId: string;
  date: string;
  hour: number;
  predictedPassengers: number;
  requiredBuses: number;
  recommendedFrequency: number;
  confidence: number;
}
