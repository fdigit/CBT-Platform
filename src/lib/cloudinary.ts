import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dkvrlr8g7',
  api_key: process.env.CLOUDINARY_API_KEY || '874261378328187',
  api_secret:
    process.env.CLOUDINARY_API_SECRET || '1TEWGTfG5D9MyngLXKtI7pylO7A',
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  bytes: number;
  format: string;
  resource_type: string;
  created_at: string;
}

export interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  allowed_formats?: string[];
  max_bytes?: number;
  public_id?: string;
  tags?: string[];
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || 'cbt-platform',
      resource_type: options.resource_type || 'auto',
      allowed_formats: options.allowed_formats || [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'pdf',
        'doc',
        'docx',
        'ppt',
        'pptx',
        'xls',
        'xlsx',
        'txt',
        'mp4',
        'mp3',
      ],
      max_bytes: options.max_bytes || 25 * 1024 * 1024, // 25MB default
      public_id: options.public_id,
      tags: options.tags || ['cbt-platform'],
      use_filename: true,
      unique_filename: true,
    };

    const result = await cloudinary.uploader.upload(
      file as string,
      uploadOptions
    );

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      original_filename: result.original_filename || '',
      bytes: result.bytes,
      format: result.format,
      resource_type: result.resource_type,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

/**
 * Upload assignment attachment
 */
export async function uploadAssignmentAttachment(
  file: Buffer | string,
  assignmentId: string,
  originalFilename: string
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, {
    folder: `cbt-platform/assignments/${assignmentId}`,
    tags: ['assignment', 'attachment', assignmentId],
    public_id: `${assignmentId}_${Date.now()}_${originalFilename.split('.')[0]}`,
  });
}

/**
 * Upload assignment submission
 */
export async function uploadSubmissionAttachment(
  file: Buffer | string,
  submissionId: string,
  studentId: string,
  originalFilename: string
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, {
    folder: `cbt-platform/submissions/${submissionId}`,
    tags: ['submission', 'attachment', submissionId, studentId],
    public_id: `${submissionId}_${studentId}_${Date.now()}_${originalFilename.split('.')[0]}`,
  });
}

/**
 * Upload lesson plan resource
 */
export async function uploadLessonPlanResource(
  file: Buffer | string,
  lessonPlanId: string,
  teacherId: string,
  originalFilename: string
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, {
    folder: `cbt-platform/lesson-plans/${lessonPlanId}`,
    tags: ['lesson-plan', 'resource', lessonPlanId, teacherId],
    public_id: `${lessonPlanId}_${teacherId}_${Date.now()}_${originalFilename.split('.')[0]}`,
  });
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}

/**
 * Generate signed upload URL for direct client uploads
 */
export function generateSignedUploadUrl(
  options: {
    folder?: string;
    tags?: string[];
    maxBytes?: number;
    allowedFormats?: string[];
  } = {}
) {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const params = {
    timestamp,
    folder: options.folder || 'cbt-platform',
    tags: options.tags?.join(',') || 'cbt-platform',
    max_bytes: options.maxBytes || 25 * 1024 * 1024,
    allowed_formats:
      options.allowedFormats?.join(',') ||
      'jpg,jpeg,png,gif,pdf,doc,docx,ppt,pptx,xls,xlsx,txt,mp4,mp3',
    use_filename: true,
    unique_filename: true,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || 'dkvrlr8g7'}/upload`,
    params: {
      ...params,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY || '874261378328187',
    },
  };
}

/**
 * Get optimized URL for file delivery
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
    crop?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    width: options.width,
    height: options.height,
    quality: options.quality || 'auto',
    format: options.format || 'auto',
    crop: options.crop || 'limit',
    secure: true,
  });
}

/**
 * Get file info from Cloudinary
 */
export async function getFileInfo(publicId: string) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Error getting file info:', error);
    throw new Error('Failed to get file information');
  }
}

export default cloudinary;
