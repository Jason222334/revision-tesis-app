import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const useSSL = this.configService.get('MINIO_USE_SSL') === 'true' || this.configService.get('NODE_ENV') === 'production';
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
      port: Number(this.configService.get('MINIO_PORT')) || (useSSL ? 443 : 9000),
      useSSL: useSSL,
      accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadmin',
      region: this.configService.get('MINIO_REGION'),
    });
    this.bucketName = this.configService.get('MINIO_BUCKET') || 'thesis-documents';
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
      }
      console.log('✅ MinIO Storage initialized');
    } catch (error) {
      console.error(
        '❌ MinIO Storage connection failed. The application will continue but file uploads may fail:',
        error.message,
      );
    }
  }

  private async ensureBucketExists() {
    // This is now handled by initializeStorage, but we keep the method for internal calls if needed
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) await this.minioClient.makeBucket(this.bucketName);
    } catch (e) {}
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    try {
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );

      return fileName;
    } catch (error) {
      throw new InternalServerErrorException('Error uploading file to storage');
    }
  }

  async getPresignedUrl(fileName: string): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucketName, fileName, 3600);
  }

  // Alias para compatibilidad con otras partes del sistema
  async getFileUrl(fileName: string): Promise<string> {
    return this.getPresignedUrl(fileName);
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const dataStream = await this.minioClient.getObject(
        this.bucketName,
        fileName,
      );
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        dataStream.on('error', (err) => reject(err));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error downloading file from storage',
      );
    }
  }
}
