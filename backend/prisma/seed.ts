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

  // ============ SETTINGS ============
  await prisma.setting.createMany({
    data: [
      { key: 'organization_name', value: 'Delhi Transport Corporation', description: 'Organization name', category: 'general' },
    ],
  });

  console.log('✅ Base users created successfully!');
  console.log(`
📊 Summary:
  - Users: 1 (SuperAdmin)
  - All other data is empty. Production ready.
  
🔑 Login Credentials:
  - superadmin@abssai.com (password: password123)
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
