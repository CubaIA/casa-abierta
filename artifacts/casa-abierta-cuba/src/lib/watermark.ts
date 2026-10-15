export const WATERMARK_TEXT = 'Casa Abierta Cuba - Propiedad de Yoanny Guillén Vargas';

export async function addWatermarkToImage(file: File): Promise<File> {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    ctx.font = `${Math.max(10, Math.floor(img.width / 60))}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    const text = WATERMARK_TEXT;
    const metrics = ctx.measureText(text);
    const x = img.width - metrics.width - 16;
    const y = img.height - 16;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    return await canvasToFile(canvas, file.name, file.type);
  } catch {
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function canvasToFile(canvas: HTMLCanvasElement, name: string, type: string): Promise<File> {
  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), type, 0.9));
  return new File([blob], name, { type });
}
