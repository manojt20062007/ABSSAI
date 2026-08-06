import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.gPSLog.deleteMany();
  await prisma.passengerDemand.deleteMany();
  await prisma.report.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.fuelRecord.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.busStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.depot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  // ============ USERS ============
  const superAdmin = await prisma.user.create({
    data: { email: 'superadmin@abssai.com', password: hashedPassword, firstName: 'Super', lastName: 'Admin', role: 'SUPER_ADMIN', isActive: true, isVerified: true, phone: '+91-9000000001' },
  });

  const admin = await prisma.user.create({
    data: { email: 'admin@abssai.com', password: hashedPassword, firstName: 'Rajesh', lastName: 'Kumar', role: 'ADMIN', isActive: true, isVerified: true, phone: '+91-9000000002' },
  });

  const scheduler = await prisma.user.create({
    data: { email: 'scheduler@abssai.com', password: hashedPassword, firstName: 'Priya', lastName: 'Sharma', role: 'SCHEDULER', isActive: true, isVerified: true, phone: '+91-9000000003' },
  });

  const depotMgr = await prisma.user.create({
    data: { email: 'depotmgr@abssai.com', password: hashedPassword, firstName: 'Suresh', lastName: 'Patel', role: 'DEPOT_MANAGER', isActive: true, isVerified: true, phone: '+91-9000000004' },
  });

  const passenger = await prisma.user.create({
    data: { email: 'passenger@abssai.com', password: hashedPassword, firstName: 'Amit', lastName: 'Verma', role: 'PASSENGER', isActive: true, isVerified: true, phone: '+91-9000000010' },
  });

  // Driver users
  const driverUsers = await Promise.all(
    Array.from({ length: 20 }, (_, i) => {
      const names = ['Manoj', 'Vikram', 'Arjun', 'Deepak', 'Sanjay', 'Ramesh', 'Kiran', 'Anil', 'Ravi', 'Sunil',
                      'Ganesh', 'Prakash', 'Mohan', 'Vijay', 'Ashok', 'Naveen', 'Yogesh', 'Rakesh', 'Dinesh', 'Mahesh'];
      const lastNames = ['Singh', 'Yadav', 'Reddy', 'Nair', 'Gupta', 'Joshi', 'Mishra', 'Pillai', 'Das', 'Shah',
                          'Rao', 'Iyer', 'Kumar', 'Pandey', 'Verma', 'Mehta', 'Patel', 'Thakur', 'Chauhan', 'Dubey'];
      return prisma.user.create({
        data: {
          email: `driver${i + 1}@abssai.com`, password: hashedPassword,
          firstName: names[i], lastName: lastNames[i],
          role: 'DRIVER', isActive: true, isVerified: true,
          phone: `+91-98${String(i + 10).padStart(8, '0')}`,
        },
      });
    })
  );

  // ============ DEPOTS ============
  const depots = await Promise.all([
    prisma.depot.create({ data: { name: 'IP Depot', code: 'IPD', address: 'IP Estate, New Delhi - 110002', latitude: 28.6261, longitude: 77.2408, capacity: 150, contactPhone: '+91-11-23379005', managerName: 'Suresh Patel' } }),
    prisma.depot.create({ data: { name: 'Rajghat Depot', code: 'RGD', address: 'Rajghat, Ring Road, New Delhi', latitude: 28.6489, longitude: 77.2496, capacity: 200, contactPhone: '+91-11-23381234', managerName: 'Harish Chandra' } }),
    prisma.depot.create({ data: { name: 'Dwarka Depot', code: 'DWD', address: 'Sector 21, Dwarka, New Delhi', latitude: 28.5921, longitude: 77.0460, capacity: 120, contactPhone: '+91-11-25071234', managerName: 'Anita Mehra' } }),
    prisma.depot.create({ data: { name: 'Rohini Depot', code: 'RHD', address: 'Sector 18, Rohini, New Delhi', latitude: 28.7321, longitude: 77.1220, capacity: 180, contactPhone: '+91-11-27551234', managerName: 'Rakesh Bhatia' } }),
    prisma.depot.create({ data: { name: 'Mehrauli Depot', code: 'MHD', address: 'Mehrauli, New Delhi', latitude: 28.5245, longitude: 77.1857, capacity: 100, contactPhone: '+91-11-26641234', managerName: 'Dinesh Kumar' } }),
  ]);

  // ============ BUSES ============
  const busModels = ['Tata Starbus', 'Ashok Leyland BS-VI', 'Eicher Skyline', 'Tata LP 1512', 'BYD K7'];
  const manufacturers = ['Tata Motors', 'Ashok Leyland', 'Eicher', 'Tata Motors', 'BYD'];
  const fuelTypes: ('DIESEL' | 'CNG' | 'ELECTRIC')[] = ['DIESEL', 'CNG', 'CNG', 'DIESEL', 'ELECTRIC'];

  const buses = await Promise.all(
    Array.from({ length: 30 }, (_, i) => {
      const modelIdx = i % 5;
      const statuses: ('ACTIVE' | 'INACTIVE' | 'MAINTENANCE')[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'MAINTENANCE'];
      return prisma.bus.create({
        data: {
          busNumber: `DL1PC-${String(1000 + i).padStart(4, '0')}`,
          registrationNumber: `DL-1P-C-${String(1000 + i)}`,
          capacity: [40, 45, 50, 55, 35][modelIdx],
          model: busModels[modelIdx],
          manufacturer: manufacturers[modelIdx],
          yearOfManufacture: 2020 + (i % 4),
          fuelType: fuelTypes[modelIdx],
          mileage: [4.5, 5.2, 4.8, 4.0, 12.0][modelIdx],
          status: statuses[i % 5],
          gpsDeviceId: `GPS-${String(i + 1).padStart(4, '0')}`,
          depotId: depots[i % 5].id,
          insuranceExpiry: new Date(2026, 11, 31),
          fitnessExpiry: new Date(2026, 5, 30),
          totalKmRun: Math.round(50000 + Math.random() * 150000),
        },
      });
    })
  );

  // ============ DRIVERS ============
  const shifts: ('MORNING' | 'AFTERNOON' | 'NIGHT' | 'SPLIT')[] = ['MORNING', 'AFTERNOON', 'NIGHT', 'SPLIT'];
  const drivers = await Promise.all(
    driverUsers.map((user, i) =>
      prisma.driver.create({
        data: {
          userId: user.id,
          employeeId: `EMP-${String(1000 + i).padStart(4, '0')}`,
          licenseNumber: `DL-${String(2020 + i).padStart(10, '0')}`,
          licenseExpiry: new Date(2027, i % 12, 1),
          emergencyContact: ['Spouse', 'Parent', 'Sibling'][i % 3],
          emergencyPhone: `+91-97${String(i + 10).padStart(8, '0')}`,
          shift: shifts[i % 4],
          experience: 3 + (i % 15),
          medicalFitness: true,
          medicalExpiryDate: new Date(2026, 11, 31),
          performanceScore: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          totalTrips: Math.floor(500 + Math.random() * 2000),
          isAvailable: i < 16,
          depotId: depots[i % 5].id,
        },
      })
    )
  );

  // ============ BUS STOPS ============
  const stopData = [
    { name: 'ISBT Kashmere Gate', code: 'ISBT-KG', lat: 28.6683, lng: 77.2289, landmark: 'Metro Station' },
    { name: 'Red Fort', code: 'RED-FORT', lat: 28.6562, lng: 77.2293, landmark: 'Red Fort Monument' },
    { name: 'Delhi Gate', code: 'DLH-GATE', lat: 28.6448, lng: 77.2413, landmark: 'Delhi Gate' },
    { name: 'ITO', code: 'ITO', lat: 28.6329, lng: 77.2395, landmark: 'Income Tax Office' },
    { name: 'Pragati Maidan', code: 'PRGTI-MDN', lat: 28.6218, lng: 77.2473, landmark: 'Exhibition Ground' },
    { name: 'India Gate', code: 'IND-GATE', lat: 28.6087, lng: 77.2450, landmark: 'India Gate War Memorial' },
    { name: 'Lajpat Nagar', code: 'LJPT-NGR', lat: 28.5921, lng: 77.2490, landmark: 'Metro Station' },
    { name: 'Nehru Place', code: 'NEHRU-PL', lat: 28.5685, lng: 77.2508, landmark: 'IT Market' },
    { name: 'Dwarka Sec 21', code: 'DWK-21', lat: 28.5921, lng: 77.0460, landmark: 'Metro Station' },
    { name: 'Dwarka Sec 14', code: 'DWK-14', lat: 28.5973, lng: 77.0643, landmark: 'Hospital' },
    { name: 'Palam', code: 'PALAM', lat: 28.6073, lng: 77.0870, landmark: 'Airport Flyover' },
    { name: 'Delhi Cantt', code: 'DLH-CANTT', lat: 28.6126, lng: 77.1126, landmark: 'Cantonment Station' },
    { name: 'Dhaula Kuan', code: 'DHAULA', lat: 28.6195, lng: 77.1473, landmark: 'Metro Station' },
    { name: 'Sarojini Nagar', code: 'SRJNI', lat: 28.6167, lng: 77.2076, landmark: 'Market' },
    { name: 'Connaught Place', code: 'CP', lat: 28.6261, lng: 77.2181, landmark: 'Rajiv Chowk Metro' },
    { name: 'AIIMS', code: 'AIIMS', lat: 28.5728, lng: 77.2190, landmark: 'Hospital' },
    { name: 'Hauz Khas', code: 'HZ-KHAS', lat: 28.5625, lng: 77.2117, landmark: 'Metro Station' },
    { name: 'Saket', code: 'SAKET', lat: 28.5437, lng: 77.1945, landmark: 'Select Citywalk Mall' },
    { name: 'New Delhi Station', code: 'NDLS', lat: 28.6431, lng: 77.2211, landmark: 'Railway Station' },
    { name: 'Chandni Chowk', code: 'CH-CHOWK', lat: 28.6562, lng: 77.2293, landmark: 'Metro Station' },
    { name: 'Rohini Sec 18', code: 'RHN-18', lat: 28.7321, lng: 77.1220, landmark: 'Rohini West Metro' },
    { name: 'Pitampura', code: 'PITAM', lat: 28.7134, lng: 77.1333, landmark: 'TV Tower' },
    { name: 'Noida Sec 62', code: 'NOD-62', lat: 28.5700, lng: 77.3210, landmark: 'Electronic City' },
    { name: 'Anand Vihar ISBT', code: 'AV-ISBT', lat: 28.6468, lng: 77.3159, landmark: 'Terminal' },
    { name: 'Karol Bagh', code: 'KRL-BGH', lat: 28.6562, lng: 77.1732, landmark: 'Market' },
  ];

  const stops = await Promise.all(
    stopData.map((s) =>
      prisma.busStop.create({
        data: {
          name: s.name, code: s.code, latitude: s.lat, longitude: s.lng,
          nearbyLandmark: s.landmark,
          shelterAvailable: Math.random() > 0.3,
          digitalDisplay: Math.random() > 0.5,
          wheelchairAccessible: Math.random() > 0.4,
          passengerCapacity: 30 + Math.floor(Math.random() * 70),
        },
      })
    )
  );

  // ============ ROUTES ============
  const routes = await Promise.all([
    prisma.route.create({
      data: {
        routeNumber: '423', name: 'ISBT to Nehru Place', source: 'ISBT Kashmere Gate', destination: 'Nehru Place',
        distance: 15.5, estimatedTime: 55, fare: 25, peakFrequency: 8, normalFrequency: 15, nightFrequency: 30,
        stops: { create: [0, 1, 2, 3, 4, 5, 6, 7].map((idx, seq) => ({ stopId: stops[idx].id, sequence: seq + 1, distanceFromStart: seq * 2.2, timeFromStart: seq * 7 })) },
      },
    }),
    prisma.route.create({
      data: {
        routeNumber: '534', name: 'Dwarka to Connaught Place', source: 'Dwarka Sector 21', destination: 'Connaught Place',
        distance: 22.0, estimatedTime: 70, fare: 30, peakFrequency: 10, normalFrequency: 20, nightFrequency: 40,
        stops: { create: [8, 9, 10, 11, 12, 13, 14].map((idx, seq) => ({ stopId: stops[idx].id, sequence: seq + 1, distanceFromStart: seq * 3.2, timeFromStart: seq * 10 })) },
      },
    }),
    prisma.route.create({
      data: {
        routeNumber: '764', name: 'Saket to Chandni Chowk', source: 'Saket', destination: 'Chandni Chowk',
        distance: 18.0, estimatedTime: 65, fare: 25, peakFrequency: 10, normalFrequency: 18, nightFrequency: 35,
        stops: { create: [17, 16, 15, 14, 18, 19].map((idx, seq) => ({ stopId: stops[idx].id, sequence: seq + 1, distanceFromStart: seq * 3.0, timeFromStart: seq * 11 })) },
      },
    }),
    prisma.route.create({
      data: {
        routeNumber: '181', name: 'Noida to Anand Vihar', source: 'Noida Sector 62', destination: 'Anand Vihar ISBT',
        distance: 14.0, estimatedTime: 45, fare: 20, peakFrequency: 7, normalFrequency: 15, nightFrequency: 30,
        stops: { create: [22, 23].map((idx, seq) => ({ stopId: stops[idx].id, sequence: seq + 1, distanceFromStart: seq * 7.0, timeFromStart: seq * 22 })) },
      },
    }),
    prisma.route.create({
      data: {
        routeNumber: '340', name: 'Rohini to AIIMS', source: 'Rohini Sector 18', destination: 'AIIMS',
        distance: 20.0, estimatedTime: 75, fare: 30, peakFrequency: 12, normalFrequency: 22, nightFrequency: 45,
        stops: { create: [20, 21, 24, 15].map((idx, seq) => ({ stopId: stops[idx].id, sequence: seq + 1, distanceFromStart: seq * 5.0, timeFromStart: seq * 19 })) },
      },
    }),
  ]);

  // ============ SAMPLE TRIPS ============
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const schedule = await prisma.schedule.create({
    data: { name: `Schedule ${today.toISOString().split('T')[0]}`, date: today, status: 'ACTIVE', totalTrips: 30, busesUsed: 15, driversUsed: 15, optimizationScore: 87.5 },
  });

  for (let i = 0; i < 30; i++) {
    const depTime = new Date(today);
    depTime.setHours(5 + Math.floor(i / 2), (i % 2) * 30, 0);
    const route = routes[i % 5];
    const arrTime = new Date(depTime);
    arrTime.setMinutes(arrTime.getMinutes() + [55, 70, 65, 45, 75][i % 5]);

    await prisma.trip.create({
      data: {
        tripNumber: i + 1, scheduleId: schedule.id,
        busId: buses[i % buses.length].id,
        driverId: drivers[i % drivers.length].id,
        routeId: route.id,
        departureTime: depTime, arrivalTime: arrTime,
        status: depTime < new Date() ? 'COMPLETED' : 'SCHEDULED',
        isReturnTrip: i % 3 === 0,
        occupancy: Math.floor(Math.random() * 50) + 5,
        maxOccupancy: 55,
        delay: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
      },
    });
  }

  // ============ MAINTENANCE RECORDS ============
  for (let i = 0; i < 10; i++) {
    const sDate = new Date(); sDate.setDate(sDate.getDate() + (i - 5));
    await prisma.maintenanceRecord.create({
      data: {
        busId: buses[i % buses.length].id,
        type: ['ROUTINE', 'INSPECTION', 'ROUTINE', 'EMERGENCY', 'OVERHAUL'][i % 5] as any,
        status: i < 3 ? 'COMPLETED' : i < 7 ? 'PENDING' : 'IN_PROGRESS',
        description: ['Oil change & filter', 'Brake inspection', 'Tyre rotation', 'Engine repair', 'Full overhaul'][i % 5],
        scheduledDate: sDate,
        completedDate: i < 3 ? sDate : undefined,
        cost: [2500, 1500, 3000, 15000, 50000][i % 5],
        oilChange: i % 3 === 0, brakeCheck: i % 2 === 0, tyreHealth: i % 4 === 0,
        batteryCheck: i % 5 === 0, engineCheck: i % 3 === 1,
      },
    });
  }

  // ============ FUEL RECORDS ============
  for (let i = 0; i < 30; i++) {
    const fDate = new Date(); fDate.setDate(fDate.getDate() - i);
    await prisma.fuelRecord.create({
      data: {
        busId: buses[i % buses.length].id,
        date: fDate,
        quantity: 50 + Math.random() * 100,
        costPerUnit: 85 + Math.random() * 10,
        totalCost: (50 + Math.random() * 100) * (85 + Math.random() * 10),
        odometer: 50000 + i * 200 + Math.random() * 100,
        mileage: 3.5 + Math.random() * 3,
        fuelStation: ['Indian Oil', 'HP', 'Bharat Petroleum', 'Shell'][i % 4],
      },
    });
  }

  // ============ ATTENDANCE ============
  for (let i = 0; i < 7; i++) {
    const aDate = new Date(); aDate.setDate(aDate.getDate() - i); aDate.setHours(0, 0, 0, 0);
    for (let j = 0; j < Math.min(drivers.length, 15); j++) {
      const checkIn = new Date(aDate); checkIn.setHours(6 + (j % 3) * 8, Math.floor(Math.random() * 30));
      const checkOut = new Date(checkIn); checkOut.setHours(checkOut.getHours() + 8);
      await prisma.attendance.create({
        data: {
          driverId: drivers[j].id, date: aDate,
          checkIn, checkOut: i > 0 ? checkOut : undefined,
          shift: shifts[j % 4], status: Math.random() > 0.1 ? 'PRESENT' : 'LATE',
          lateMinutes: Math.random() > 0.8 ? Math.floor(Math.random() * 20) : 0,
        },
      }).catch(() => {}); // ignore duplicates
    }
  }

  // ============ PASSENGER DEMAND ============
  for (let i = 0; i < 7; i++) {
    const dDate = new Date(); dDate.setDate(dDate.getDate() - i);
    for (const route of routes) {
      for (let hour = 5; hour <= 23; hour++) {
        let base = 100;
        if (hour >= 7 && hour <= 9) base = 380;
        else if (hour >= 17 && hour <= 20) base = 400;
        else if (hour >= 11 && hour <= 14) base = 200;
        await prisma.passengerDemand.create({
          data: {
            routeId: route.id, date: dDate, hour,
            dayOfWeek: dDate.getDay(),
            passengerCount: Math.round(base * (0.8 + Math.random() * 0.4)),
            isWeekend: dDate.getDay() === 0 || dDate.getDay() === 6,
          },
        });
      }
    }
  }

  // ============ NOTIFICATIONS ============
  const notifTypes: any[] = ['BUS_DELAY', 'MAINTENANCE', 'SHIFT_CHANGE', 'SYSTEM', 'ROUTE_CHANGE'];
  for (let i = 0; i < 10; i++) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: ['Bus Delayed', 'Maintenance Due', 'Shift Updated', 'System Update', 'Route Changed'][i % 5],
        message: ['Bus DL1PC-1002 delayed by 8 mins', 'Bus DL1PC-1005 maintenance overdue', 'Driver shift changed to afternoon', 'System maintenance at 2 AM', 'Route 423 diverted'][i % 5],
        type: notifTypes[i % 5],
        isRead: i > 5,
      },
    });
  }

  // ============ SETTINGS ============
  await prisma.setting.createMany({
    data: [
      { key: 'max_driver_hours', value: '8', description: 'Maximum driving hours per day', category: 'scheduling' },
      { key: 'max_trips_per_bus', value: '12', description: 'Maximum trips per bus per day', category: 'scheduling' },
      { key: 'break_duration', value: '30', description: 'Break duration in minutes', category: 'scheduling' },
      { key: 'peak_hour_start_morning', value: '07:00', description: 'Morning peak start', category: 'scheduling' },
      { key: 'peak_hour_end_morning', value: '10:00', description: 'Morning peak end', category: 'scheduling' },
      { key: 'peak_hour_start_evening', value: '17:00', description: 'Evening peak start', category: 'scheduling' },
      { key: 'peak_hour_end_evening', value: '20:00', description: 'Evening peak end', category: 'scheduling' },
      { key: 'default_fare', value: '15', description: 'Default fare in INR', category: 'general' },
      { key: 'gps_update_interval', value: '3000', description: 'GPS update interval in ms', category: 'tracking' },
      { key: 'organization_name', value: 'Delhi Transport Corporation', description: 'Organization name', category: 'general' },
    ],
  });

  console.log('✅ Seed data created successfully!');
  console.log(`
📊 Summary:
  - Users: ${6 + driverUsers.length} (SuperAdmin, Admin, Scheduler, DepotMgr, Passenger, ${driverUsers.length} Drivers)
  - Depots: ${depots.length}
  - Buses: ${buses.length}
  - Drivers: ${drivers.length}
  - Stops: ${stops.length}
  - Routes: ${routes.length}
  - Trips: 30
  - Maintenance Records: 10
  - Fuel Records: 30
  
🔑 Login Credentials (all passwords: password123):
  - superadmin@abssai.com (Super Admin)
  - admin@abssai.com (Admin)
  - scheduler@abssai.com (Scheduler)
  - depotmgr@abssai.com (Depot Manager)
  - driver1@abssai.com (Driver)
  - passenger@abssai.com (Passenger)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
