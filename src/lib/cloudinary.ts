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
  use_filename?: boolean;
  unique_filename?: boolean;
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    // Start with base options
    const uploadOptions: any = {
      folder: options.folder || 'cbt-platform',
      resource_type: options.resource_type || 'raw',
      max_bytes: options.max_bytes || 25 * 1024 * 1024, // 25MB default
      public_id: options.public_id,
      tags: options.tags || ['cbt-platform'],
      use_filename:
        options.use_filename !== undefined ? options.use_filename : true,
      unique_filename:
        options.unique_filename !== undefined ? options.unique_filename : true,
    };

    // Add allowed_formats if provided in options
    if (options.allowed_formats) {
      uploadOptions.allowed_formats = options.allowed_formats;
    }

    // Handle both Buffer and string inputs
    let uploadInput: string;
    if (Buffer.isBuffer(file)) {
      // Convert Buffer to base64 data URL
      const fileExtension =
        options.public_id?.split('.').pop()?.toLowerCase() || 'bin';
      let mimeType = 'application/octet-stream';

      // Determine MIME type based on file extension
      if (fileExtension === 'pdf') mimeType = 'application/pdf';
      else if (fileExtension === 'docx')
        mimeType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (fileExtension === 'doc') mimeType = 'application/msword';
      else if (fileExtension === 'pptx')
        mimeType =
          'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (fileExtension === 'ppt')
        mimeType = 'application/vnd.ms-powerpoint';
      else if (fileExtension === 'xlsx')
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (fileExtension === 'xls') mimeType = 'application/vnd.ms-excel';
      else if (fileExtension === 'txt') mimeType = 'text/plain';
      else if (fileExtension === 'jpg' || fileExtension === 'jpeg')
        mimeType = 'image/jpeg';
      else if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'gif') mimeType = 'image/gif';
      else if (fileExtension === 'mp4') mimeType = 'video/mp4';
      else if (fileExtension === 'mp3') mimeType = 'audio/mpeg';

      uploadInput = `data:${mimeType};base64,${file.toString('base64')}`;
    } else {
      uploadInput = file as string;
    }

    console.log('Cloudinary upload options:', uploadOptions);
    console.log(
      'Upload input type:',
      Buffer.isBuffer(file) ? 'Buffer (converted to base64)' : 'String'
    );

    const result = await cloudinary.uploader.upload(uploadInput, uploadOptions);

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
 * Upload lesson plan resource (simple version)
 */
export async function uploadLessonPlanResourceSimple(
  file: Buffer | string,
  lessonPlanId: string,
  teacherId: string,
  originalFilename: string
): Promise<CloudinaryUploadResult> {
  try {
    console.log('=== UPLOAD DEBUG START ===');
    console.log('File type:', typeof file);
    console.log('Is Buffer:', Buffer.isBuffer(file));
    console.log(
      'File size:',
      Buffer.isBuffer(file) ? file.length : (file as string).length
    );
    console.log('Filename:', originalFilename);

    // Convert file to base64 data URL
    const fileBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    const fileExtension = originalFilename.split('.').pop()?.toLowerCase();

    // Determine MIME type based on file extension
    let mimeType = 'application/octet-stream';
    if (fileExtension === 'pdf') mimeType = 'application/pdf';
    else if (fileExtension === 'docx')
      mimeType =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (fileExtension === 'doc') mimeType = 'application/msword';
    else if (fileExtension === 'pptx')
      mimeType =
        'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (fileExtension === 'ppt')
      mimeType = 'application/vnd.ms-powerpoint';
    else if (fileExtension === 'xlsx')
      mimeType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (fileExtension === 'xls') mimeType = 'application/vnd.ms-excel';
    else if (fileExtension === 'txt') mimeType = 'text/plain';
    else if (fileExtension === 'jpg' || fileExtension === 'jpeg')
      mimeType = 'image/jpeg';
    else if (fileExtension === 'png') mimeType = 'image/png';
    else if (fileExtension === 'gif') mimeType = 'image/gif';
    else if (fileExtension === 'mp4') mimeType = 'video/mp4';
    else if (fileExtension === 'mp3') mimeType = 'audio/mpeg';

    console.log('MIME type:', mimeType);
    console.log('File extension:', fileExtension);

    const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    console.log('Data URL length:', dataUrl.length);
    console.log('Data URL preview:', dataUrl.substring(0, 100) + '...');

    // Use absolute minimal options for maximum compatibility
    const uploadOptions = {
      folder: `cbt-platform/lesson-plans/${lessonPlanId}`,
      resource_type: 'raw' as const,
    };

    console.log('Upload options:', uploadOptions);
    console.log('About to call cloudinary.uploader.upload...');

    const result = await cloudinary.uploader.upload(dataUrl, uploadOptions);

    console.log('Upload successful!');
    console.log('Upload result:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
    });

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
    console.error('=== UPLOAD ERROR ===');
    console.error('Error type:', typeof error);
    console.error(
      'Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : undefined
    );
    console.error('=== END UPLOAD ERROR ===');
    throw new Error('Failed to upload file to Cloudinary');
  }
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
  // Determine resource type based on file extension
  const fileExtension = originalFilename.split('.').pop()?.toLowerCase();
  let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'raw';

  if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
    resourceType = 'image';
  } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExtension || '')) {
    resourceType = 'video';
  } else if (
    ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(
      fileExtension || ''
    )
  ) {
    resourceType = 'raw';
  }

  // For documents, try without allowed_formats restriction
  const uploadOptions: any = {
    folder: `cbt-platform/lesson-plans/${lessonPlanId}`,
    resource_type: resourceType,
    tags: ['lesson-plan', 'resource', lessonPlanId, teacherId],
    public_id: `${lessonPlanId}_${teacherId}_${Date.now()}_${originalFilename.split('.')[0]}`,
    use_filename: true,
    unique_filename: true,
  };

  // Only add allowed_formats for images and videos, not for raw documents
  if (resourceType === 'image' || resourceType === 'video') {
    uploadOptions.allowed_formats =
      resourceType === 'image'
        ? ['jpg', 'jpeg', 'png', 'gif']
        : ['mp4', 'avi', 'mov', 'wmv'];
  }

  return uploadToCloudinary(file, uploadOptions);
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
