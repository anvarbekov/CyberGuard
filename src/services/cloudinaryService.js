// src/services/cloudinaryService.js
// Cloudinary file upload for incident reports

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cyberguard_reports';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export function validateFile(file) {
  if (!file) return { valid: false, error: "Fayl tanlanmagan" };
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: "Fayl hajmi 10MB dan oshmasligi kerak" };
  if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: "Faqat JPG, PNG, WebP, GIF va PDF formatlar ruxsat etilgan" };
  return { valid: true };
}

export async function uploadToCloudinary(file, options = {}) {
  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error);

  if (!CLOUD_NAME) {
    // Demo mode — return fake URL
    await new Promise(r => setTimeout(r, 1500));
    return {
      url: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
      publicId: `cyberguard/demo_${Date.now()}`,
      format: file.type.split('/')[1],
      size: file.size,
      width: 800,
      height: 600,
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', options.folder || 'cyberguard/reports');

  if (options.transformation) {
    formData.append('transformation', JSON.stringify(options.transformation));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  let response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: formData, signal: controller.signal }
    );
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === 'AbortError') throw new Error('Yuklash vaqti tugadi (30s)');
    throw new Error('Tarmoq xatosi: ' + fetchErr.message);
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Yuklash amalga oshmadi");
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    size: data.bytes,
    width: data.width,
    height: data.height,
  };
}

export async function uploadMultiple(files, onProgress) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadToCloudinary(files[i]);
    results.push(result);
    if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return results;
}

export function getOptimizedUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary.com')) return url;
  const { width = 800, quality = 'auto', format = 'auto' } = options;
  return url.replace('/upload/', `/upload/w_${width},q_${quality},f_${format}/`);
}
