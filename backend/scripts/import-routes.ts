import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface Stop {
  name: string;
  road: string;
  pickupTime: string;
  dropTime?: string;
}

interface Route {
  routeNumber: string;
  name: string;
  stops: Stop[];
}

async function main() {
  console.log('🚌 Starting route import...');

  // 1. Delete existing data
  console.log('🗑️  Deleting existing routes and stops...');
  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.busStop.deleteMany();

  // 2. Read the parsed data
  const dataPath = path.join(__dirname, 'pdf-routes-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const routesData: Route[] = JSON.parse(rawData);

  // 3. Keep track of created stops to avoid duplicates (based on name)
  const stopMap = new Map<string, string>(); // name -> id

  console.log(`📦 Found ${routesData.length} routes to import.`);

  for (const routeData of routesData) {
    console.log(`🛤️  Importing Route: ${routeData.routeNumber} - ${routeData.name}`);

    // Create the route
    const route = await prisma.route.create({
      data: {
        routeNumber: routeData.routeNumber,
        name: routeData.name,
        source: routeData.stops[0]?.name || 'Unknown',
        destination: routeData.stops[routeData.stops.length - 1]?.name || 'Unknown',
        distance: 15.0, // Dummy distance
        estimatedTime: 60, // Dummy time
        fare: 20, // Dummy fare
        isActive: true,
      }
    });

    const addedStops = new Set<string>();

    // Create stops and link them
    for (let i = 0; i < routeData.stops.length; i++) {
      const stopData = routeData.stops[i];
      let stopId = stopMap.get(stopData.name);

      if (!stopId) {
        // Create new stop
        const stopCode = stopData.name.replace(/\s+/g, '_').substring(0, 10).toUpperCase() + '_' + Math.floor(Math.random() * 10000);
        const stop = await prisma.busStop.create({
          data: {
            name: stopData.name,
            code: stopCode,
            latitude: 13.0 + (Math.random() * 0.1), // Dummy lat
            longitude: 80.0 + (Math.random() * 0.1), // Dummy long
            isActive: true,
          }
        });
        stopId = stop.id;
        stopMap.set(stopData.name, stopId);
      }

      if (addedStops.has(stopId)) {
        console.log(`    ⚠️ Skipping duplicate stop in route: ${stopData.name}`);
        continue;
      }
      addedStops.add(stopId);

      // Create RouteStop link
      await prisma.routeStop.create({
        data: {
          routeId: route.id,
          stopId: stopId,
          sequence: i + 1,
          distanceFromStart: i * 1.5, // Dummy distance
          timeFromStart: i * 5, // Dummy time
        }
      });
    }
  }

  console.log('✅ Import completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
