export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  quality: number = 0.9
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas size to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Isi canvas dengan warna latar merah (jika ada area kosong/transparan)
  ctx.fillStyle = '#cc0000'; // Warna merah standar pas foto
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    // Recursive function to compress until file size is under 500KB
    const tryCompress = (q: number) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          
          // Check if size > 500KB (500 * 1024 bytes)
          if (blob.size > 500 * 1024 && q > 0.1) {
            // Reduce quality and try again
            tryCompress(q - 0.1);
          } else {
            const file = new File([blob], 'foto_wisuda.jpg', { type: 'image/jpeg' });
            resolve(file);
          }
        },
        'image/jpeg',
        q
      );
    };
    
    tryCompress(quality);
  });
}
