import imageCompression from 'browser-image-compression';
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export async function compressImage(file: File, onProgress?: (value: number) => void): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('画像ファイルを選択してください');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('写真は1枚15MB以下にしてください');
  try { return await imageCompression(file, { maxWidthOrHeight:1600, maxSizeMB:1.8, useWebWorker:true, fileType:'image/webp', initialQuality:0.78, onProgress }); }
  catch { throw new Error('この画像形式を処理できません。iPhoneでJPEGに変換して再度お試しください'); }
}
