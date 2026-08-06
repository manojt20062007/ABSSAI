import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_6IMbADRy7UNS@ep-tiny-unit-az01hykx.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    },
  },
});

async function main() {
  const driverId = 'cm6sypvym0004y9d0syd50i1e'; // Wait, I need to find the driver id
  
  const drivers = await prisma.driver.findMany({ include: { user: true }});
  console.log("Drivers:", drivers.map(d => ({id: d.id, email: d.user.email})));

  const trips = await prisma.trip.findMany();
  console.log("Trips:", trips.map(t => ({id: t.id, driverId: t.driverId, status: t.status})));

  const logs = await prisma.boardingLog.findMany();
  console.log("Boarding Logs:", logs.map(l => ({id: l.id, tripId: l.tripId, studentId: l.studentId})));
}

main().catch(console.error).finally(() => prisma.$disconnect());
