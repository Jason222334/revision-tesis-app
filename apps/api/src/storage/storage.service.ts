import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  HeadBucketCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get('MINIO_ENDPOINT');
    const useSSL = this.configService.get('MINIO_USE_SSL') === 'true' || this.configService.get('NODE_ENV') === 'production';
    
    // Si es Supabase, necesitamos construir el endpoint completo con la ruta S3
    // La URL correcta de Supabase S3 es: https://[ref].supabase.co/storage/v1/s3
    let s3Endpoint = endpoint;
    if (endpoint && !endpoint.startsWith('http')) {
      // Si el endpoint no tiene la ruta de Supabase y parece un host de Supabase, la añadimos
      if (endpoint.includes('supabase.co') && !endpoint.includes('/storage/v1/s3')) {
        // Limpiamos el endpoint de posibles prefijos como 'storage.' que a veces se confunden
        const cleanHost = endpoint.replace('storage.', '');
        s3Endpoint = `https://${cleanHost}/storage/v1/s3`;
      } else {
        s3Endpoint = `${useSSL ? 'https' : 'http'}://${endpoint}`;
        const port = this.configService.get('MINIO_PORT');
        if (port && port !== '443' && port !== '80') {
          s3Endpoint += `:${port}`;
        }
      }
    }

    this.s3Client = new S3Client({
      endpoint: s3Endpoint,
      region: this.configService.get('MINIO_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
        secretAccessKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadmin',
      },
      forcePathStyle: true, // Requerido para Supabase y MinIO local
    });

    this.bucketName = this.configService.get('MINIO_BUCKET') || 'thesis-documents';
  }

  async onModuleInit() {
    await this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // En producción con S3/Supabase, solo verificamos si podemos acceder al bucket
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      console.log(`✅ Storage initialized. Connected to bucket: ${this.bucketName}`);
    } catch (error) {
      console.warn(
        `⚠️ Storage validation warning: Could not verify bucket "${this.bucketName}". ` +
        `Ensure it exists in your provider. Error: ${error.message}`
      );
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      return fileName;
    } catch (error) {
      console.error('Upload Error:', error);
      throw new InternalServerErrorException('Error uploading file to storage: ' + error.message);
    }
  }

  async getPresignedUrl(fileName: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Presigned URL Error:', error);
      return '';
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    return this.getPresignedUrl(fileName);
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
        })
      );
      
      if (!response.Body) {
        throw new InternalServerErrorException('Empty response body from storage');
      }
      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch (error) {
      throw new InternalServerErrorException('Error downloading file from storage: ' + error.message);
    }
  }
}
