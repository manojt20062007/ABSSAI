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

  const driverUser = await prisma.user.create({
    data: { email: 'driver@abssai.com', password: hashedPassword, firstName: 'Rajesh', lastName: 'Kumar', role: 'DRIVER', isActive: true, isVerified: true, phone: '+91-9000000002' },
  });

  const studentUser = await prisma.user.create({
    data: { email: 'student@abssai.com', password: hashedPassword, firstName: 'Aarav', lastName: 'Sharma', role: 'STUDENT', isActive: true, isVerified: true, phone: '+91-9000000003' },
  });

  // ============ DEPOTS ============
  const depot = await prisma.depot.create({
    data: { name: 'Central Depot', code: 'DEP-01', address: '123 Main St', capacity: 50 },
  });

  // ============ BUSES ============
  const bus = await prisma.bus.create({
    data: {
      busNumber: 'BUS-1001',
      registrationNumber: 'DL-1P-1001',
      capacity: 55,
      model: 'Tata Starbus',
      manufacturer: 'Tata Motors',
      depotId: depot.id,
    },
  });

  // ============ PROFILES ============
  await prisma.driver.create({
    data: {
      userId: driverUser.id,
      employeeId: 'DRV-001',
      licenseNumber: 'DL-LIC-001',
      licenseExpiry: new Date('2030-12-31'),
      depotId: depot.id,
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId: studentUser.id,
      studentId: 'STU-001',
      department: 'Computer Science',
      section: 'A',
      year: '3rd Year',
      boardingPoint: 'City Center',
      destination: 'University Campus',
      validUntil: new Date('2027-12-31'),
      assignedBusId: bus.id,
    },
  });

  // ============ SETTINGS ============
  await prisma.setting.createMany({
    data: [
      { key: 'organization_name', value: 'ABSSAI Transport', description: 'Organization name', category: 'general' },
    ],
  });

  console.log('✅ Users and test data created successfully!');
  console.log(`
📊 Summary:
  - Users: 3 (Admin, Driver, Student)
  - Buses: 1
  
🔑 Login Credentials (password for all is 'password123'):
  - Admin:   superadmin@abssai.com
  - Driver:  driver@abssai.com
  - Student: student@abssai.com
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
