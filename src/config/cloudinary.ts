import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

const isConfigured = env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadToCloudinary(fileBuffer: Buffer, folder: string = 'treatment-photos'): Promise<string> {
  if (!isConfigured) {
    throw new Error('Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      },
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(url: string): Promise<void> {
  if (!isConfigured) return;

  const publicId = extractPublicId(url);
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId);
}

function extractPublicId(url: string): string | null {
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) return null;
    const filename = parts[parts.length - 1];
    const folder = parts.slice(uploadIndex + 2, parts.length - 1).join('/');
    const publicId = folder ? `${folder}/${filename.replace(/\.[^.]+$/, '')}` : filename.replace(/\.[^.]+$/, '');
    return publicId;
  } catch {
    return null;
  }
}

export { isConfigured };
