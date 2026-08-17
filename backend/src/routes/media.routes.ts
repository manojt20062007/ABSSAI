import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { GoogleDriveService } from '../services/GoogleDriveService';

const router = Router();
router.use(authenticate);

// Ensure uploads/media directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'media');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Save with unique secure filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Multer Filter Configuration
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mime = file.mimetype.toLowerCase();
  const name = file.originalname.toLowerCase();
  if (
    mime.startsWith('video/') ||
    mime.startsWith('audio/') ||
    mime.includes('webm') ||
    mime.includes('mp4') ||
    mime.includes('ogg') ||
    mime.includes('wav') ||
    mime.includes('mpeg') ||
    mime.includes('aac') ||
    mime === 'application/octet-stream' ||
    name.endsWith('.webm') ||
    name.endsWith('.wav') ||
    name.endsWith('.mp3') ||
    name.endsWith('.mp4')
  ) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported file format: ${file.mimetype}`, 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB absolute cap for videos
  },
});

/**
 * @route POST /api/media/upload
 * @desc Upload evidence video or audio chunk associated with a safety event
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      ResponseHandler.badRequest(res, 'No media file provided');
      return;
    }

    const {
      safetyEventId,
      tripId,
      busId,
      routeId,
      type, // "VIDEO" | "AUDIO"
      duration,
      latitude,
      longitude,
      gpsAccuracy,
      device,
      cameraFacing,
      interrupted,
      interruptionReason,
      checksum,
      uploadAttempts = '1',
      failureReason,
    } = req.body;

    if (!type || !['VIDEO', 'AUDIO'].includes(type)) {
      // Remove file if type is invalid
      fs.unlinkSync(req.file.path);
      ResponseHandler.badRequest(res, 'Valid type ("VIDEO" | "AUDIO") is required');
      return;
    }

    // Checksum deduplication
    if (checksum) {
      const existingMedia = await prisma.media.findFirst({
        where: { checksum },
      });

      if (existingMedia) {
        // Delete the redundant physical file to save space
        fs.unlinkSync(req.file.path);
        ResponseHandler.success(res, existingMedia, 'Media already uploaded (deduplicated)');
        return;
      }
    }

    let validSafetyEventId = null;
    let validTripId = null;
    let validBusId = null;
    let validRouteId = null;

    if (safetyEventId) {
      const e = await prisma.safetyEvent.findUnique({ where: { id: safetyEventId } });
      if (e) validSafetyEventId = safetyEventId;
    }
    if (tripId) {
      const t = await prisma.trip.findUnique({ where: { id: tripId } });
      if (t) validTripId = t.id;
    }
    if (busId) {
      const b = await prisma.bus.findUnique({ where: { id: busId } });
      if (b) validBusId = b.id;
    }
    if (routeId) {
      const r = await prisma.route.findUnique({ where: { id: routeId } });
      if (r) validRouteId = r.id;
    }

    // Auto-upload to Google Drive if configured
    let fileUrl = `/uploads/media/${req.file.filename}`;
    const driveUpload = await GoogleDriveService.uploadFile(
      req.file.path,
      req.file.mimetype,
      req.file.filename
    );

    if (driveUpload?.webViewLink) {
      fileUrl = driveUpload.webViewLink;
    }

    // Create the media row in prisma
    const media = await prisma.media.create({
      data: {
        safetyEventId: validSafetyEventId,
        userId: req.user!.userId,
        tripId: validTripId,
        busId: validBusId,
        routeId: validRouteId,
        type,
        fileUrl,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        duration: duration ? Number(duration) : null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        gpsAccuracy: gpsAccuracy ? Number(gpsAccuracy) : null,
        status: 'COMPLETED',
        device: device || 'WEB',
        cameraFacing: cameraFacing || null,
        interrupted: interrupted === 'true',
        interruptionReason: interruptionReason || null,
        uploadAttempts: Number(uploadAttempts),
        lastUploadAttemptAt: new Date(),
        checksum: checksum || null,
        failureReason: failureReason || null,
        uploadedAt: new Date(),
      },
    });

    ResponseHandler.created(res, media, 'Media file uploaded successfully');
  } catch (error) {
    // If multer or database errors occur, remove the uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {}
    }
    next(error);
  }
});

/**
 * @route GET /api/media
 * @desc List all media records
 */
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, safetyEventId, type, status } = req.query;
    const where: any = {};

    if (safetyEventId) where.safetyEventId = safetyEventId as string;
    if (type) where.type = type as string;
    if (status) where.status = status as string;

    const [data, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count({ where }),
    ]);

    ResponseHandler.paginated(res, data, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/media/:id
 * @desc Get single media metadata
 */
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!media) {
      ResponseHandler.notFound(res, 'Media record not found');
      return;
    }

    ResponseHandler.success(res, media);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/media/:id
 * @desc Delete media record and remove corresponding physical file
 */
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!media) {
      ResponseHandler.notFound(res, 'Media record not found');
      return;
    }

    // Delete local physical file if it exists
    if (media.fileUrl) {
      const filePath = path.join(process.cwd(), media.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to delete media file: ${filePath}`, err);
        }
      }
    }

    // Delete record from database
    await prisma.media.delete({
      where: { id: String(req.params.id) },
    });

    ResponseHandler.success(res, null, 'Media deleted successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
