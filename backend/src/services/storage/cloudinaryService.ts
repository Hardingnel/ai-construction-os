import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

const isConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options?: { folder?: string; resourceType?: 'image' | 'raw' | 'video'; transformation?: any }
): Promise<CloudinaryUploadResult | null> {
  if (!isConfigured) return null;
  const folder = options?.folder || 'aicos';
  const publicId = `${folder}/${uuidv4()}`;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: options?.resourceType || 'raw', overwrite: true },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({
          url: result.url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    ).end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!isConfigured) return false;
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch { return false; }
}

export function getOptimizedUrl(publicId: string, options?: { width?: number; height?: number; quality?: number; format?: string }): string {
  if (!isConfigured) return '';
  const transforms = [];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.quality) transforms.push(`q_${options.quality}`);
  if (options?.format) transforms.push(`f_${options.format}`);
  return cloudinary.url(publicId, { transformation: transforms.join(',') });
}

export { cloudinary, isConfigured };
