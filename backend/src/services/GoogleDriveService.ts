import { google } from 'googleapis';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

export class GoogleDriveService {
  private static driveClient: any = null;

  /**
   * Configure Cloudinary if environment variables exist
   */
  private static initCloudinary(): boolean {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryUrl) {
      cloudinary.config({ cloudinary_url: cloudinaryUrl });
      return true;
    }

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      return true;
    }

    return false;
  }

  /**
   * Initializes Google Drive OAuth2 / Service Account Client
   */
  private static getDriveClient() {
    if (this.driveClient) return this.driveClient;

    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    // 1. OAuth2 User Flow (Recommended for personal Gmail 15GB Quota)
    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      logger.info('✅ Google Drive API Service Initialized via OAuth2 User Quota');
      return this.driveClient;
    }

    // 2. Service Account Flow
    const serviceAccountEmail = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountEmail && privateKey) {
      const jwtClient = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.driveClient = google.drive({ version: 'v3', auth: jwtClient });
      logger.info('✅ Google Drive API Service Initialized via Service Account');
      return this.driveClient;
    }

    return null;
  }

  /**
   * Uploads a local file to Cloudinary / Google Drive and returns shareable public URL
   */
  public static async uploadFile(
    localFilePath: string,
    mimeType: string,
    customFilename?: string
  ): Promise<{ fileId: string; webViewLink: string; webContentLink: string } | null> {
    if (!fs.existsSync(localFilePath)) {
      logger.error(`Upload error: Local file not found at ${localFilePath}`);
      return null;
    }

    // Priority 1: Cloudinary Video Cloud Storage (25 GB Free, No 403 Quota Issues)
    if (this.initCloudinary()) {
      try {
        logger.info('🚀 Uploading video to Cloudinary Video Cloud Storage...');
        const result = await cloudinary.uploader.upload(localFilePath, {
          resource_type: 'auto',
          folder: 'abssai_safety_recordings',
          public_id: customFilename ? path.parse(customFilename).name : undefined,
        });

        logger.info(`✅ Successfully uploaded video to Cloudinary! URL: ${result.secure_url}`);
        return {
          fileId: result.public_id,
          webViewLink: result.secure_url,
          webContentLink: result.secure_url,
        };
      } catch (err) {
        logger.error('❌ Cloudinary upload failed, trying Google Drive fallback:', err);
      }
    }

    // Priority 2: Google Drive API
    try {
      const drive = this.getDriveClient();
      if (!drive) return null;

      const fileName = customFilename || path.basename(localFilePath);
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

      const requestBody: any = {
        name: fileName,
        mimeType: mimeType || 'video/webm',
      };

      if (folderId) {
        requestBody.parents = [folderId.trim()];
      }

      const media = {
        mimeType: mimeType || 'video/webm',
        body: fs.createReadStream(localFilePath),
      };

      const response = await drive.files.create({
        requestBody,
        media,
        supportsAllDrives: true,
        supportsTeamDrives: true,
        fields: 'id, name, webViewLink, webContentLink',
      });

      const fileId = response.data.id;
      logger.info(`✅ Successfully uploaded video to Google Drive! File ID: ${fileId}`);

      try {
        await drive.permissions.create({
          fileId: fileId,
          supportsAllDrives: true,
          supportsTeamDrives: true,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permErr) {
        logger.warn('Could not set public permission on Google Drive file:', permErr);
      }

      return {
        fileId: fileId,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`,
      };
    } catch (error: any) {
      logger.error('❌ Google Drive Upload Error:', error?.message || error);
      return null;
    }
  }
}
