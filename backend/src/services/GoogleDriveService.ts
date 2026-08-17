import { google } from 'googleapis';
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
   * Initializes Google Drive OAuth2 / Service Account Client
   */
  private static getDriveClient() {
    if (this.driveClient) return this.driveClient;

    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      logger.info('✅ Google Drive API Service Initialized via OAuth2');
      return this.driveClient;
    }

    // Check for Service Account Key environment variables
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

    logger.warn('⚠️ Google Drive API credentials missing in .env. Falling back to local storage.');
    return null;
  }

  /**
   * Uploads a local file to Google Drive folder and returns shareable public URL
   */
  public static async uploadFile(
    localFilePath: string,
    mimeType: string,
    customFilename?: string
  ): Promise<{ fileId: string; webViewLink: string; webContentLink: string } | null> {
    try {
      const drive = this.getDriveClient();
      if (!drive) return null;

      if (!fs.existsSync(localFilePath)) {
        logger.error(`Google Drive Upload error: Local file not found at ${localFilePath}`);
        return null;
      }

      const fileName = customFilename || path.basename(localFilePath);
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // Required Google Drive Shared Folder ID

      if (!folderId) {
        logger.warn('⚠️ GOOGLE_DRIVE_FOLDER_ID is missing in .env! Service accounts require a shared folder ID to use your 15GB storage quota.');
      }

      const requestBody: any = {
        name: fileName,
        mimeType: mimeType || 'video/webm',
      };

      if (folderId) {
        requestBody.parents = [folderId];
      }

      const media = {
        mimeType: mimeType || 'video/webm',
        body: fs.createReadStream(localFilePath),
      };

      // 1. Upload File with supportsAllDrives & supportsTeamDrives flags
      const response = await drive.files.create({
        requestBody,
        media,
        supportsAllDrives: true,
        supportsTeamDrives: true,
        fields: 'id, name, webViewLink, webContentLink',
      });

      const fileId = response.data.id;
      logger.info(`✅ Successfully uploaded video to Google Drive! File ID: ${fileId}`);

      // 2. Set Public Read Permission so Admin Dashboard can view/stream
      await drive.permissions.create({
        fileId: fileId,
        supportsAllDrives: true,
        supportsTeamDrives: true,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return {
        fileId: fileId,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`,
      };
    } catch (error) {
      logger.error('❌ Failed to upload video to Google Drive:', error);
      return null;
    }
  }
}
