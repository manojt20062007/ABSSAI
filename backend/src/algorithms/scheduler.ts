import prisma from '../config/database';
import { logger } from '../utils/logger';

interface Gene {
  busId: string;
  driverId: string;
  routeId: string;
  departureTime: number; // minutes from midnight
  tripDuration: number;  // minutes
  isReturnTrip: boolean;
}

interface Chromosome {
  genes: Gene[];
  fitness: number;
}

interface ScheduleConfig {
  date: Date;
  depotId?: string;
  maxDriverHours: number;
  maxTripsPerBus: number;
  breakDuration: number;
  peakHours: { start: number; end: number }[];
  populationSize: number;
  generations: number;
  mutationRate: number;
  elitismRate: number;
}

const DEFAULT_CONFIG: Partial<ScheduleConfig> = {
  maxDriverHours: 8,
  maxTripsPerBus: 12,
  breakDuration: 30,
  peakHours: [{ start: 7 * 60, end: 10 * 60 }, { start: 17 * 60, end: 20 * 60 }],
  populationSize: 100,
  generations: 300,
  mutationRate: 0.15,
  elitismRate: 0.1,
};

export class SchedulingEngine {
  private config: ScheduleConfig;
  private buses: any[] = [];
  private drivers: any[] = [];
  private routes: any[] = [];

  constructor(config: Partial<ScheduleConfig> & { date: Date }) {
    this.config = { ...DEFAULT_CONFIG, ...config } as ScheduleConfig;
  }

  async generateSchedule(): Promise<any> {
    logger.info('🧬 Starting schedule generation...');

    // Load available resources
    await this.loadResources();

    if (this.buses.length === 0 || this.drivers.length === 0 || this.routes.length === 0) {
      logger.warn('Insufficient resources for scheduling');
      return this.createEmptySchedule();
    }

    // Run genetic algorithm
    const bestChromosome = this.evolve();

    // Convert to schedule
    const schedule = await this.saveSchedule(bestChromosome);

    logger.info(`✅ Schedule generated: ${bestChromosome.genes.length} trips, fitness: ${bestChromosome.fitness.toFixed(4)}`);
    return schedule;
  }

  private async loadResources(): Promise<void> {
    const where: any = {};
    if (this.config.depotId) where.depotId = this.config.depotId;

    [this.buses, this.drivers, this.routes] = await Promise.all([
      prisma.bus.findMany({ where: { status: 'ACTIVE', ...where } }),
      prisma.driver.findMany({
        where: { isAvailable: true, medicalFitness: true, ...where },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.route.findMany({
        where: { isActive: true },
        include: { stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
      }),
    ]);

    logger.info(`Resources: ${this.buses.length} buses, ${this.drivers.length} drivers, ${this.routes.length} routes`);
  }

  private evolve(): Chromosome {
    // Initialize population
    let population = Array.from({ length: this.config.populationSize }, () => this.createRandomChromosome());
    population.forEach((c) => (c.fitness = this.calculateFitness(c)));
    population.sort((a, b) => b.fitness - a.fitness);

    let bestEver = { ...population[0] };
    let stagnation = 0;

    for (let gen = 0; gen < this.config.generations; gen++) {
      const newPopulation: Chromosome[] = [];

      // Elitism
      const eliteCount = Math.floor(this.config.populationSize * this.config.elitismRate);
      for (let i = 0; i < eliteCount; i++) {
        newPopulation.push({ ...population[i] });
      }

      // Crossover + Mutation
      while (newPopulation.length < this.config.populationSize) {
        const parent1 = this.tournamentSelect(population);
        const parent2 = this.tournamentSelect(population);
        let child = this.crossover(parent1, parent2);

        if (Math.random() < this.config.mutationRate) {
          child = this.mutate(child);
        }

        child.fitness = this.calculateFitness(child);
        newPopulation.push(child);
      }

      population = newPopulation.sort((a, b) => b.fitness - a.fitness);

      if (population[0].fitness > bestEver.fitness) {
        bestEver = { ...population[0] };
        stagnation = 0;
      } else {
        stagnation++;
      }

      // Early termination
      if (stagnation >= 50) {
        logger.info(`Converged at generation ${gen}`);
        break;
      }

      if (gen % 50 === 0) {
        logger.debug(`Gen ${gen}: best=${population[0].fitness.toFixed(4)}, avg=${(population.reduce((s, c) => s + c.fitness, 0) / population.length).toFixed(4)}`);
      }
    }

    return bestEver;
  }

  private createRandomChromosome(): Chromosome {
    const genes: Gene[] = [];
    const operatingStart = 5 * 60;  // 5 AM
    const operatingEnd = 23 * 60;   // 11 PM

    // For each route, create trips throughout the day
    for (const route of this.routes) {
      let time = operatingStart;

      while (time < operatingEnd) {
        const isPeak = this.config.peakHours.some((p) => time >= p.start && time <= p.end);
        const frequency = isPeak ? route.peakFrequency : route.normalFrequency;

        const bus = this.buses[Math.floor(Math.random() * this.buses.length)];
        const driver = this.drivers[Math.floor(Math.random() * this.drivers.length)];

        genes.push({
          busId: bus.id,
          driverId: driver.id,
          routeId: route.id,
          departureTime: time,
          tripDuration: route.estimatedTime,
          isReturnTrip: false,
        });

        // Return trip
        const returnDeparture = time + route.estimatedTime + 5; // 5 min turnaround
        if (returnDeparture + route.estimatedTime <= operatingEnd) {
          genes.push({
            busId: bus.id,
            driverId: driver.id,
            routeId: route.id,
            departureTime: returnDeparture,
            tripDuration: route.estimatedTime,
            isReturnTrip: true,
          });
        }

        time += frequency;
      }
    }

    return { genes, fitness: 0 };
  }

  private calculateFitness(chromosome: Chromosome): number {
    let score = 100;
    const driverHours: Map<string, number> = new Map();
    const busTrips: Map<string, number> = new Map();
    const driverTrips: Map<string, { start: number; end: number }[]> = new Map();
    const busSlots: Map<string, { start: number; end: number }[]> = new Map();

    for (const gene of chromosome.genes) {
      // Track driver hours
      const currentHours = driverHours.get(gene.driverId) || 0;
      driverHours.set(gene.driverId, currentHours + gene.tripDuration / 60);

      // Track bus trips
      const currentTrips = busTrips.get(gene.busId) || 0;
      busTrips.set(gene.busId, currentTrips + 1);

      // Track time slots for conflict detection
      const tripEnd = gene.departureTime + gene.tripDuration;
      const dSlots = driverTrips.get(gene.driverId) || [];
      dSlots.push({ start: gene.departureTime, end: tripEnd });
      driverTrips.set(gene.driverId, dSlots);

      const bSlots = busSlots.get(gene.busId) || [];
      bSlots.push({ start: gene.departureTime, end: tripEnd });
      busSlots.set(gene.busId, bSlots);
    }

    // Penalty: Driver exceeds max hours
    for (const [, hours] of driverHours) {
      if (hours > this.config.maxDriverHours) {
        score -= (hours - this.config.maxDriverHours) * 10;
      }
    }

    // Penalty: Bus exceeds max trips
    for (const [, trips] of busTrips) {
      if (trips > this.config.maxTripsPerBus) {
        score -= (trips - this.config.maxTripsPerBus) * 5;
      }
    }

    // Penalty: Time conflicts (driver/bus double-booked)
    for (const [, slots] of driverTrips) {
      slots.sort((a, b) => a.start - b.start);
      for (let i = 1; i < slots.length; i++) {
        if (slots[i].start < slots[i - 1].end) {
          score -= 15; // conflict penalty
        }
      }
    }

    for (const [, slots] of busSlots) {
      slots.sort((a, b) => a.start - b.start);
      for (let i = 1; i < slots.length; i++) {
        if (slots[i].start < slots[i - 1].end) {
          score -= 15;
        }
      }
    }

    // Reward: Workload balance among drivers
    const hourValues = Array.from(driverHours.values());
    if (hourValues.length > 1) {
      const avg = hourValues.reduce((s, v) => s + v, 0) / hourValues.length;
      const variance = hourValues.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / hourValues.length;
      score -= variance * 2; // penalize imbalance
    }

    // Reward: Bus utilization
    const usedBuses = busTrips.size;
    const utilizationRate = usedBuses / Math.max(this.buses.length, 1);
    score += utilizationRate * 10;

    // Reward: Peak coverage
    const peakTrips = chromosome.genes.filter((g) =>
      this.config.peakHours.some((p) => g.departureTime >= p.start && g.departureTime <= p.end)
    );
    score += (peakTrips.length / Math.max(chromosome.genes.length, 1)) * 15;

    return Math.max(0, score);
  }

  private tournamentSelect(population: Chromosome[], k = 3): Chromosome {
    let best = population[Math.floor(Math.random() * population.length)];
    for (let i = 1; i < k; i++) {
      const candidate = population[Math.floor(Math.random() * population.length)];
      if (candidate.fitness > best.fitness) best = candidate;
    }
    return best;
  }

  private crossover(parent1: Chromosome, parent2: Chromosome): Chromosome {
    const len = Math.min(parent1.genes.length, parent2.genes.length);
    const crossPoint1 = Math.floor(len / 3);
    const crossPoint2 = Math.floor((2 * len) / 3);

    const genes = [
      ...parent1.genes.slice(0, crossPoint1),
      ...parent2.genes.slice(crossPoint1, crossPoint2),
      ...parent1.genes.slice(crossPoint2),
    ];

    return { genes, fitness: 0 };
  }

  private mutate(chromosome: Chromosome): Chromosome {
    const genes = [...chromosome.genes];
    const mutationType = Math.random();

    if (mutationType < 0.33 && genes.length > 0) {
      // Swap mutation: swap bus or driver assignment
      const idx = Math.floor(Math.random() * genes.length);
      if (Math.random() < 0.5) {
        genes[idx] = { ...genes[idx], busId: this.buses[Math.floor(Math.random() * this.buses.length)].id };
      } else {
        genes[idx] = { ...genes[idx], driverId: this.drivers[Math.floor(Math.random() * this.drivers.length)].id };
      }
    } else if (mutationType < 0.66 && genes.length > 0) {
      // Time shift mutation
      const idx = Math.floor(Math.random() * genes.length);
      const shift = (Math.random() - 0.5) * 30; // +/- 15 minutes
      const newTime = Math.max(300, Math.min(1380, genes[idx].departureTime + shift));
      genes[idx] = { ...genes[idx], departureTime: Math.round(newTime) };
    } else if (genes.length > 1) {
      // Remove random gene
      genes.splice(Math.floor(Math.random() * genes.length), 1);
    }

    return { genes, fitness: 0 };
  }

  private async saveSchedule(chromosome: Chromosome): Promise<any> {
    const schedule = await prisma.schedule.create({
      data: {
        name: `Schedule ${this.config.date.toISOString().split('T')[0]}`,
        date: this.config.date,
        status: 'DRAFT',
        totalTrips: chromosome.genes.length,
        busesUsed: new Set(chromosome.genes.map((g) => g.busId)).size,
        driversUsed: new Set(chromosome.genes.map((g) => g.driverId)).size,
        optimizationScore: chromosome.fitness,
      },
    });

    // Create trips
    const tripData = chromosome.genes.map((gene, idx) => {
      const depTime = new Date(this.config.date);
      depTime.setHours(0, 0, 0, 0);
      depTime.setMinutes(gene.departureTime);

      const arrTime = new Date(depTime);
      arrTime.setMinutes(arrTime.getMinutes() + gene.tripDuration);

      return {
        tripNumber: idx + 1,
        scheduleId: schedule.id,
        busId: gene.busId,
        driverId: gene.driverId,
        routeId: gene.routeId,
        departureTime: depTime,
        arrivalTime: arrTime,
        isReturnTrip: gene.isReturnTrip,
        status: 'SCHEDULED' as const,
      };
    });

    await prisma.trip.createMany({ data: tripData });

    return {
      ...schedule,
      metrics: {
        totalTrips: chromosome.genes.length,
        busesUsed: new Set(chromosome.genes.map((g) => g.busId)).size,
        driversUsed: new Set(chromosome.genes.map((g) => g.driverId)).size,
        fitness: chromosome.fitness,
        peakTrips: chromosome.genes.filter((g) =>
          this.config.peakHours.some((p) => g.departureTime >= p.start && g.departureTime <= p.end)
        ).length,
      },
    };
  }

  private createEmptySchedule() {
    return {
      name: `Empty Schedule - ${this.config.date.toISOString().split('T')[0]}`,
      date: this.config.date,
      totalTrips: 0,
      busesUsed: 0,
      driversUsed: 0,
      metrics: { totalTrips: 0, busesUsed: 0, driversUsed: 0, fitness: 0, peakTrips: 0 },
      warning: 'Insufficient resources. Add buses, drivers, and routes first.',
    };
  }
}

export class DemandPredictor {
  static predict(params: {
    routeId: string; date: Date; historicalData?: any[];
  }): any[] {
    const { date } = params;
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const predictions = [];
    for (let hour = 5; hour <= 23; hour++) {
      // Base demand curve (typical transit pattern)
      let baseDemand = 100;
      if (hour >= 7 && hour <= 9) baseDemand = 400;        // Morning peak
      else if (hour >= 9 && hour <= 11) baseDemand = 250;
      else if (hour >= 11 && hour <= 14) baseDemand = 200;
      else if (hour >= 14 && hour <= 17) baseDemand = 280;
      else if (hour >= 17 && hour <= 20) baseDemand = 420; // Evening peak
      else if (hour >= 20 && hour <= 22) baseDemand = 180;
      else baseDemand = 80;

      // Weekend adjustment
      if (isWeekend) baseDemand *= 0.6;

      // Add noise
      const noise = (Math.random() - 0.5) * 0.2;
      const predictedCount = Math.round(baseDemand * (1 + noise));
      const busCapacity = 55;
      const requiredBuses = Math.ceil(predictedCount / (busCapacity * 0.8));
      const frequency = Math.max(5, Math.round(60 / requiredBuses));

      predictions.push({
        hour,
        predictedPassengers: predictedCount,
        requiredBuses,
        recommendedFrequency: frequency,
        confidence: 0.75 + Math.random() * 0.2,
        isPeak: (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20),
      });
    }

    return predictions;
  }
}
