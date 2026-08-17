import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';
import { RiskAnalysisService } from '../services/RiskAnalysisService';
import { getIO } from '../socket';

const router = Router();

// Authenticate all safety event endpoints
router.use(authenticate);

/**
 * @route POST /api/safety/events or POST /api/safety
 * @desc Create a new safety event (abnormal stop detected or driver emergency panic button)
 */
const createSafetyEventHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      tripId,
      busId,
      driverId,
      routeId,
      latitude,
      longitude,
      gpsAccuracy,
      speed,
      stopDuration,
      driverResponse,
      severity,
    } = req.body;

    let validTripId = null;
    let validBusId = null;
    let validDriverId = null;
    let validRouteId = null;

    if (tripId) {
      const existingTrip = await prisma.trip.findUnique({ where: { id: tripId } });
      if (existingTrip) validTripId = tripId;
    }
    if (busId) {
      const existingBus = await prisma.bus.findUnique({ where: { id: busId } });
      if (existingBus) validBusId = busId;
    }
    if (driverId) {
      const existingDriver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (existingDriver) validDriverId = driverId;
    }
    if (routeId) {
      const existingRoute = await prisma.route.findUnique({ where: { id: routeId } });
      if (existingRoute) validRouteId = routeId;
    }

    const safetyEvent = await prisma.safetyEvent.create({
      data: {
        tripId: validTripId,
        busId: validBusId,
        driverId: validDriverId,
        routeId: validRouteId,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        gpsAccuracy: gpsAccuracy ? Number(gpsAccuracy) : null,
        speed: speed !== undefined ? Number(speed) : null,
        stopDuration: stopDuration ? Number(stopDuration) : null,
        driverResponse: driverResponse || 'NO_RESPONSE',
        severity: severity || 'HIGH',
        status: 'OPEN',
      },
    });

    await RiskAnalysisService.analyzeSafetyEvent(safetyEvent.id);

    const updatedEvent = await prisma.safetyEvent.findUnique({
      where: { id: safetyEvent.id },
      include: {
        trip: { select: { tripNumber: true } },
        driver: { select: { employeeId: true, user: { select: { firstName: true, lastName: true } } } },
        bus: { select: { busNumber: true } },
        route: { select: { routeNumber: true } },
      },
    });

    if (severity === 'HIGH' || safetyEvent.severity === 'HIGH') {
      try {
        const io = getIO();
        io.to('dashboard').emit('safety_event_alert', updatedEvent);
      } catch (err) {
        console.error('Failed to emit Socket.IO safety alert:', err);
      }
    }

    ResponseHandler.created(res, updatedEvent, 'Safety event recorded successfully');
  } catch (error) {
    next(error);
  }
};

router.post('/', createSafetyEventHandler);
router.post('/events', createSafetyEventHandler);

/**
 * @route GET /api/safety/events or GET /api/safety
 * @desc List all safety events (paginated and filterable)
 */
const getSafetyEventsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, tripId, busId, driverId, routeId, status, severity } = req.query;
    const where: any = {};

    if (tripId) where.tripId = tripId as string;
    if (busId) where.busId = busId as string;
    if (driverId) where.driverId = driverId as string;
    if (routeId) where.routeId = routeId as string;
    if (status) where.status = status as string;
    if (severity) where.severity = severity as string;

    const [data, total] = await Promise.all([
      prisma.safetyEvent.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { detectedAt: 'desc' },
        include: {
          bus: { select: { busNumber: true } },
          driver: { select: { employeeId: true, user: { select: { firstName: true, lastName: true } } } },
          route: { select: { routeNumber: true, name: true } },
          media: true,
        },
      }),
      prisma.safetyEvent.count({ where }),
    ]);

    ResponseHandler.paginated(res, data, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN', 'SCHEDULER'), getSafetyEventsHandler);
router.get('/events', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN', 'SCHEDULER'), getSafetyEventsHandler);

/**
 * @route GET /api/safety/events/:id or GET /api/safety/:id
 * @desc Get single safety event with associated media files
 */
const getSafetyEventByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.safetyEvent.findUnique({
      where: { id: String(req.params.id) },
      include: {
        bus: true,
        driver: { include: { user: true } },
        route: true,
        trip: true,
        media: true,
      },
    });

    if (!event) {
      ResponseHandler.notFound(res, 'Safety event not found');
      return;
    }

    ResponseHandler.success(res, event);
  } catch (error) {
    next(error);
  }
};

router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN', 'SCHEDULER'), getSafetyEventByIdHandler);
router.get('/events/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN', 'SCHEDULER'), getSafetyEventByIdHandler);

/**
 * @route PATCH /api/safety/events/:id/status or PATCH /api/safety/:id/status
 * @desc Update the status of a safety event (e.g. resolve it)
 */
const updateSafetyEventStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      ResponseHandler.badRequest(res, 'Status is required');
      return;
    }

    const data: any = { status };
    if (notes !== undefined) data.notes = notes;
    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    }

    const updatedEvent = await prisma.safetyEvent.update({
      where: { id: String(req.params.id) },
      data,
      include: {
        bus: { select: { busNumber: true } },
        driver: { select: { employeeId: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    ResponseHandler.success(res, updatedEvent, 'Safety event status updated');
  } catch (error) {
    next(error);
  }
};

router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN', 'SCHEDULER'), updateSafetyEventStatusHandler);
router.patch('/events/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN', 'SCHEDULER'), updateSafetyEventStatusHandler);

export default router;
