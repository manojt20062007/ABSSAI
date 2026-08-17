import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Semmancheri -> Vel Tech High Tech College route data...');

  // 1. Get Depot
  let depot = await prisma.depot.findFirst();
  if (!depot) {
    depot = await prisma.depot.create({
      data: { name: 'Chennai Central Depot', code: 'DEP-CHE', address: 'OMR Chennai', capacity: 100 }
    });
  }

  // 2. Create or Update Route: Semmancheri to Vel Tech High Tech College
  const routeNumber = 'R-VT101';
  let route = await prisma.route.findFirst({ where: { routeNumber } });

  if (!route) {
    route = await prisma.route.create({
      data: {
        routeNumber,
        name: 'Semmancheri to Vel Tech High Tech College',
        source: 'Semmancheri, Chennai',
        destination: 'Vel Tech High Tech College, Avadi',
        distance: 48.5,
        estimatedTime: 75,
        fare: 60.0,
        peakFrequency: 15,
        normalFrequency: 30,
        nightFrequency: 60,
        isActive: true,
      }
    });
  } else {
    route = await prisma.route.update({
      where: { id: route.id },
      data: {
        name: 'Semmancheri to Vel Tech High Tech College',
        source: 'Semmancheri, Chennai',
        destination: 'Vel Tech High Tech College, Avadi',
        distance: 48.5,
        estimatedTime: 75,
        isActive: true,
      }
    });
  }

  // 3. Create Bus Stops
  const stopsData = [
    { name: 'Semmancheri Bus Stop', code: 'SMC-01', latitude: 12.8717, longitude: 80.2263, nearbyLandmark: 'Semmancheri Signal' },
    { name: 'Sholinganallur Junction', code: 'SHL-02', latitude: 12.9010, longitude: 80.2279, nearbyLandmark: 'Sholinganallur Wipro' },
    { name: 'Vel Tech High Tech College', code: 'VTH-03', latitude: 13.1843, longitude: 80.1033, nearbyLandmark: 'Vel Tech Campus Avadi' },
  ];

  // Clean old stops for this route
  await prisma.routeStop.deleteMany({ where: { routeId: route.id } });

  for (let i = 0; i < stopsData.length; i++) {
    const sd = stopsData[i];
    let busStop = await prisma.busStop.findFirst({ where: { code: sd.code } });
    if (!busStop) {
      busStop = await prisma.busStop.create({
        data: {
          name: sd.name,
          code: sd.code,
          latitude: sd.latitude,
          longitude: sd.longitude,
          nearbyLandmark: sd.nearbyLandmark,
          isActive: true,
        }
      });
    } else {
      busStop = await prisma.busStop.update({
        where: { id: busStop.id },
        data: { latitude: sd.latitude, longitude: sd.longitude, name: sd.name }
      });
    }

    await prisma.routeStop.create({
      data: {
        routeId: route.id,
        stopId: busStop.id,
        sequence: i + 1,
        distanceFromStart: i * 20.0,
        timeFromStart: i * 30,
      }
    });
  }

  // 4. Create or Update Bus
  let bus = await prisma.bus.findFirst({ where: { busNumber: 'BUS-VT01' } });
  if (!bus) {
    bus = await prisma.bus.create({
      data: {
        busNumber: 'BUS-VT01',
        registrationNumber: 'TN-07-VT-2026',
        capacity: 55,
        model: 'Volvo City Cruiser',
        manufacturer: 'Volvo',
        status: 'ACTIVE',
        depotId: depot.id,
        routeId: route.id,
      }
    });
  } else {
    bus = await prisma.bus.update({
      where: { id: bus.id },
      data: { routeId: route.id, status: 'ACTIVE' }
    });
  }

  // 5. Get Driver and assign Bus + Route
  const driverUser = await prisma.user.findFirst({ where: { role: 'DRIVER' } });
  if (driverUser) {
    let driver = await prisma.driver.findFirst({ where: { userId: driverUser.id } });
    if (driver) {
      driver = await prisma.driver.update({
        where: { id: driver.id },
        data: { depotId: depot.id }
      });
      // Clear currentDriverId on all other buses first
      await prisma.bus.updateMany({
        where: { currentDriverId: driver.id },
        data: { currentDriverId: null }
      });
      // Link bus to driver
      await prisma.bus.update({
        where: { id: bus.id },
        data: { currentDriverId: driver.id }
      });
    }
  }

  console.log('✅ Successfully created & assigned Route: Semmancheri -> Vel Tech High Tech College to Bus TN-07-VT-2026!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating route:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
