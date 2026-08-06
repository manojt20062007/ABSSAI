import { Server } from 'socket.io';
import { logger } from '../utils/logger';

interface SimulatedBus {
  busId: string;
  busNumber: string;
  routeName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  occupancy: number;
  maxCapacity: number;
  currentStop: string;
  nextStop: string;
  eta: number;
  delay: number;
  status: 'moving' | 'stopped' | 'delayed';
  waypoints: Array<{ lat: number; lng: number; stopName?: string }>;
  waypointIndex: number;
}

// Sample Delhi bus routes with real coordinates
const SAMPLE_ROUTES = [
  {
    name: 'Route 423 - ISBT to Nehru Place',
    stops: [
      { lat: 28.6683, lng: 77.2289, stopName: 'ISBT Kashmere Gate' },
      { lat: 28.6562, lng: 77.2293, stopName: 'Red Fort' },
      { lat: 28.6448, lng: 77.2413, stopName: 'Delhi Gate' },
      { lat: 28.6329, lng: 77.2395, stopName: 'ITO' },
      { lat: 28.6218, lng: 77.2473, stopName: 'Pragati Maidan' },
      { lat: 28.6087, lng: 77.2450, stopName: 'India Gate' },
      { lat: 28.5921, lng: 77.2490, stopName: 'Lajpat Nagar' },
      { lat: 28.5685, lng: 77.2508, stopName: 'Nehru Place' },
    ],
  },
  {
    name: 'Route 534 - Dwarka to Connaught Place',
    stops: [
      { lat: 28.5921, lng: 77.0460, stopName: 'Dwarka Sector 21' },
      { lat: 28.5973, lng: 77.0643, stopName: 'Dwarka Sector 14' },
      { lat: 28.6073, lng: 77.0870, stopName: 'Palam' },
      { lat: 28.6126, lng: 77.1126, stopName: 'Delhi Cantt' },
      { lat: 28.6195, lng: 77.1473, stopName: 'Dhaula Kuan' },
      { lat: 28.6155, lng: 77.1824, stopName: 'Moti Bagh' },
      { lat: 28.6167, lng: 77.2076, stopName: 'Sarojini Nagar' },
      { lat: 28.6261, lng: 77.2181, stopName: 'Connaught Place' },
    ],
  },
  {
    name: 'Route 764 - Mehrauli to Old Delhi',
    stops: [
      { lat: 28.5245, lng: 77.1857, stopName: 'Mehrauli' },
      { lat: 28.5437, lng: 77.1945, stopName: 'Saket' },
      { lat: 28.5625, lng: 77.2117, stopName: 'Hauz Khas' },
      { lat: 28.5728, lng: 77.2190, stopName: 'AIIMS' },
      { lat: 28.5936, lng: 77.2167, stopName: 'Safdarjung' },
      { lat: 28.6261, lng: 77.2181, stopName: 'CP Inner Circle' },
      { lat: 28.6431, lng: 77.2211, stopName: 'New Delhi Station' },
      { lat: 28.6562, lng: 77.2293, stopName: 'Chandni Chowk' },
    ],
  },
  {
    name: 'Route 181 - Noida to Anand Vihar',
    stops: [
      { lat: 28.5700, lng: 77.3210, stopName: 'Noida Sector 62' },
      { lat: 28.5800, lng: 77.3150, stopName: 'Noida City Centre' },
      { lat: 28.5920, lng: 77.3050, stopName: 'Mayur Vihar Phase 1' },
      { lat: 28.6030, lng: 77.2950, stopName: 'Akshardham' },
      { lat: 28.6150, lng: 77.2850, stopName: 'Preet Vihar' },
      { lat: 28.6316, lng: 77.2773, stopName: 'Karkardooma' },
      { lat: 28.6468, lng: 77.3159, stopName: 'Anand Vihar ISBT' },
    ],
  },
  {
    name: 'Route 340 - Rohini to AIIMS',
    stops: [
      { lat: 28.7321, lng: 77.1220, stopName: 'Rohini Sector 18' },
      { lat: 28.7134, lng: 77.1333, stopName: 'Pitampura' },
      { lat: 28.6912, lng: 77.1554, stopName: 'Shakti Nagar' },
      { lat: 28.6759, lng: 77.1643, stopName: 'Kamla Nagar' },
      { lat: 28.6562, lng: 77.1732, stopName: 'Karol Bagh' },
      { lat: 28.6355, lng: 77.1920, stopName: 'Patel Nagar' },
      { lat: 28.6105, lng: 77.2080, stopName: 'RK Ashram' },
      { lat: 28.5728, lng: 77.2190, stopName: 'AIIMS' },
    ],
  },
];

export class GPSSimulator {
  private io: Server;
  private buses: SimulatedBus[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private updateInterval = 3000; // 3 seconds

  constructor(io: Server) {
    this.io = io;
    this.initializeBuses();
  }

  private initializeBuses(): void {
    const busNumbers = ['DL1PC-0423', 'DL1PC-0534', 'DL1PC-0764', 'DL1PC-0181', 'DL1PC-0340',
                        'DL1PC-1423', 'DL1PC-1534', 'DL1PC-1764', 'DL1PC-1181', 'DL1PC-1340',
                        'DL1PC-2423', 'DL1PC-2534', 'DL1PC-2764', 'DL1PC-2181', 'DL1PC-2340'];

    this.buses = busNumbers.map((busNumber, idx) => {
      const route = SAMPLE_ROUTES[idx % SAMPLE_ROUTES.length];
      const startIdx = Math.floor(Math.random() * (route.stops.length - 1));
      const stop = route.stops[startIdx];

      return {
        busId: `bus-${idx + 1}`,
        busNumber,
        routeName: route.name,
        latitude: stop.lat + (Math.random() - 0.5) * 0.002,
        longitude: stop.lng + (Math.random() - 0.5) * 0.002,
        speed: 20 + Math.random() * 30,
        heading: Math.random() * 360,
        occupancy: Math.floor(Math.random() * 45) + 5,
        maxCapacity: 55,
        currentStop: stop.stopName || 'En Route',
        nextStop: route.stops[startIdx + 1]?.stopName || route.stops[0].stopName || 'Terminal',
        eta: Math.floor(Math.random() * 15) + 2,
        delay: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
        status: 'moving' as const,
        waypoints: route.stops,
        waypointIndex: startIdx,
      };
    });
  }

  start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.updatePositions();
      this.broadcast();
    }, this.updateInterval);

    logger.info(`🛰️  GPS Simulator started - tracking ${this.buses.length} buses`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('🛰️  GPS Simulator stopped');
    }
  }

  private updatePositions(): void {
    this.buses.forEach((bus) => {
      const waypoints = bus.waypoints;
      const nextIdx = (bus.waypointIndex + 1) % waypoints.length;
      const target = waypoints[nextIdx];

      // Move towards next waypoint
      const dlat = target.lat - bus.latitude;
      const dlng = target.lng - bus.longitude;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);

      const stepSize = 0.0008 + Math.random() * 0.0005; // variable speed

      if (dist < 0.001) {
        // Arrived at waypoint
        bus.waypointIndex = nextIdx;
        bus.currentStop = target.stopName || 'En Route';
        const nextNext = (nextIdx + 1) % waypoints.length;
        bus.nextStop = waypoints[nextNext].stopName || 'Terminal';
        bus.status = Math.random() > 0.7 ? 'stopped' : 'moving';
        bus.speed = bus.status === 'stopped' ? 0 : 15 + Math.random() * 10;

        // Simulate passenger changes at stops
        const boarding = Math.floor(Math.random() * 8);
        const alighting = Math.floor(Math.random() * 6);
        bus.occupancy = Math.max(0, Math.min(bus.maxCapacity, bus.occupancy + boarding - alighting));
      } else {
        // Move towards target
        const ratio = stepSize / dist;
        bus.latitude += dlat * ratio;
        bus.longitude += dlng * ratio;
        bus.speed = 20 + Math.random() * 35;
        bus.heading = (Math.atan2(dlng, dlat) * 180) / Math.PI;
        bus.status = 'moving';
      }

      // Simulate delays
      bus.delay = Math.random() > 0.85
        ? Math.min(bus.delay + Math.floor(Math.random() * 3), 15)
        : Math.max(0, bus.delay - 1);
      
      bus.eta = Math.max(1, Math.floor(dist * 1000) + bus.delay);
    });
  }

  private broadcast(): void {
    const gpsData = this.buses.map((bus) => ({
      busId: bus.busId,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      latitude: bus.latitude,
      longitude: bus.longitude,
      speed: Math.round(bus.speed * 10) / 10,
      heading: Math.round(bus.heading),
      occupancy: bus.occupancy,
      maxCapacity: bus.maxCapacity,
      currentStop: bus.currentStop,
      nextStop: bus.nextStop,
      eta: bus.eta,
      delay: bus.delay,
      status: bus.status,
      timestamp: new Date().toISOString(),
    }));

    this.io.to('tracking').emit('gps:update', gpsData);
    this.io.to('dashboard').emit('gps:summary', {
      totalBuses: gpsData.length,
      moving: gpsData.filter((b) => b.status === 'moving').length,
      stopped: gpsData.filter((b) => b.status === 'stopped').length,
      delayed: gpsData.filter((b) => b.delay > 0).length,
      avgOccupancy: Math.round(gpsData.reduce((s, b) => s + (b.occupancy / b.maxCapacity) * 100, 0) / gpsData.length),
    });
  }

  getBuses(): SimulatedBus[] {
    return this.buses;
  }
}
