import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseHandler } from '../utils/response';
import prisma from '../config/database';
import { getIO } from '../socket';

const router = Router();
router.use(authenticate);

// Helper: Haversine formula to calculate distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post('/scan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busId } = req.body;
    if (!busId) {
      return ResponseHandler.error(res, 'Bus ID is required', 400);
    }

    // 1. Get the student profile
    const student = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { user: { select: { firstName: true, lastName: true } } }
    });

    if (!student) {
      return ResponseHandler.error(res, 'Only students can scan boarding codes', 403);
    }

    // 2. Strict Hardcoded Bus Check
    if (student.assignedBusId && student.assignedBusId !== busId) {
      return ResponseHandler.error(res, 'Fraud Alert: You are scanning the QR code for a bus you are not assigned to!', 403);
    }

    // 3. Geofencing Check
    const { lat, lng } = req.body;
    if (!lat || !lng) {
      return ResponseHandler.error(res, 'Location is required to board the bus.', 400);
    }

    // Get the latest GPS log for this bus within the last 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const latestGps = await prisma.gPSLog.findFirst({
      where: {
        busId,
        timestamp: { gte: fifteenMinsAgo }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (!latestGps) {
      return ResponseHandler.error(res, 'Cannot verify bus location. The bus GPS is inactive or offline.', 403);
    }

    const distance = getDistanceInMeters(lat, lng, latestGps.latitude, latestGps.longitude);
    if (distance > 100) {
      return ResponseHandler.error(res, `Fraud Alert: You are ${Math.round(distance)} meters away from the bus! You must be inside the bus to scan.`, 403);
    }

    // 4. Find the active trip for this bus
    let activeTrip = await prisma.trip.findFirst({
      where: { 
        busId,
        status: { in: ['IN_PROGRESS', 'SCHEDULED'] } 
      },
      orderBy: { departureTime: 'asc' }
    });

    // DEMO FALLBACK: If no active trip, just use the first trip in the DB, or skip updating trip occupancy
    let tripId = activeTrip?.id || null;

    // 5. Create boarding log
    const boardingLog = await prisma.boardingLog.create({
      data: {
        studentId: student.id,
        busId,
        tripId,
        status: 'BOARDED',
        scanMethod: 'QR_CODE'
      }
    });

    // 6. Update trip occupancy if trip exists
    if (tripId) {
      await prisma.trip.update({
        where: { id: tripId },
        data: { occupancy: { increment: 1 } }
      });
    }

    // 7. Emit socket event to the driver dashboard
    const io = getIO();
    io.emit('passenger_boarded', {
      id: boardingLog.id,
      studentId: student.studentId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      boardingPoint: student.boardingPoint,
      destination: student.destination,
      timestamp: boardingLog.timestamp
    });

    ResponseHandler.created(res, { message: 'Boarding successful', log: boardingLog });
  } catch (error) {
    next(error);
  }
});

// Endpoint for driver to get logs for their active trip
router.get('/logs/:tripId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.boardingLog.findMany({
      where: { tripId: req.params.tripId as string },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    ResponseHandler.success(res, logs);
  } catch (error) {
    next(error);
  }
});

export default router;
