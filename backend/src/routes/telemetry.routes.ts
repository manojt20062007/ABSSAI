import { Router, Request, Response, NextFunction } from 'express';
import { getIO } from '../socket';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();
// Optionally use authenticate if drivers are sending this via a logged-in app
// router.use(authenticate); 

/**
 * @route POST /api/telemetry/location
 * @desc Receive live GPS location from driver phones or GPS devices
 */
router.post('/location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busId, lat, lng, speed, heading, tripId } = req.body;

    let actualBusId = busId;

    // If busId isn't a valid CUID, assume it's a busNumber and look it up
    if (busId && !busId.startsWith('c')) {
      const bus = await prisma.bus.findFirst({ where: { busNumber: busId } });
      if (bus) actualBusId = bus.id;
    }

    if (!actualBusId || lat === undefined || lng === undefined) {
      ResponseHandler.badRequest(res, 'Missing required telemetry fields: busId, lat, lng');
      return;
    }

    // Prepare payload mimicking what the tracker/simulator expects
    const locationUpdate = {
      busId: actualBusId,
      lat: Number(lat),
      lng: Number(lng),
      speed: Number(speed || 0),
      heading: Number(heading || 0),
      timestamp: new Date(),
      tripId
    };

    // 1. Save this to the database for Geofencing validation
    await prisma.gPSLog.create({
      data: {
        busId: actualBusId,
        latitude: Number(lat),
        longitude: Number(lng),
        speed: Number(speed || 0),
        heading: Number(heading || 0),
        timestamp: new Date()
      }
    });
    
    // 2. Broadcast the update to all clients in the 'tracking' room
    const io = getIO();
    io.to('tracking').emit('bus_location_update', locationUpdate);

    // Optional: Log it for debugging
    // console.log(`[Telemetry] Bus ${busId} updated location to ${lat}, ${lng}`);

    ResponseHandler.success(res, null, 'Location processed successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/telemetry/latest/:busId
 * @desc Get latest recorded GPS position for a bus
 */
router.get('/latest/:busId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const busId = req.params.busId as string;
    let actualBusId = busId;
    if (busId && !busId.startsWith('c')) {
      const bus = await prisma.bus.findFirst({ where: { busNumber: busId } });
      if (bus) actualBusId = bus.id;
    }

    const latestGps = await prisma.gPSLog.findFirst({
      where: { busId: actualBusId },
      orderBy: { timestamp: 'desc' }
    });

    ResponseHandler.success(res, latestGps);
  } catch (error) {
    next(error);
  }
});

export default router;
