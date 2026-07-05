export async function uploadToCloudinary(file: File | string, folder: string = 'general'): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // If Cloudinary isn't configured, just return the original file/url
  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary configuration missing, using original file/url instead');
    if (typeof file === 'string') return file;
    // For File, return a blob URL as fallback
    return URL.createObjectURL(file);
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  
  if (typeof file === 'string') {
    // If it's a base64 string or URL
    formData.append('file', file);
  } else {
    formData.append('file', file);
  }
  
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', `elsewedy-academy/${folder}`);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.warn('Cloudinary upload failed, falling back to original file/url:', errorData);
    // Fallback to original if Cloudinary fails
    if (typeof file === 'string') return file;
    return URL.createObjectURL(file);
  }

  const data = await response.json();
  return data.secure_url;
}
