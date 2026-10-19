'use server';

/**
 * Simple, robust storage helper.
 * Converts uploaded images to Base64 data URLs stored directly in database text fields,
 * avoiding external S3 / Cloudinary configuration issues and never hibernating.
 */

export async function uploadImageFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type || 'image/jpeg';
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export async function uploadImageAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) return { error: 'No file provided' };
    const url = await uploadImageFile(file);
    return { url };
  } catch (err: any) {
    console.error('Upload image action error:', err);
    return { error: err.message || 'Upload failed' };
  }
}
