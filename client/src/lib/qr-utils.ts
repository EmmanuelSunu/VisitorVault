// QR Code generation and handling utilities
// Using QRCode.js library - would need to be installed in production

export interface QRCodeOptions {
  width?: number;
  height?: number;
  colorDark?: string;
  colorLight?: string;
  correctLevel?: number;
}

export function generateQRCode(
  data: string, 
  canvas: HTMLCanvasElement, 
  options: QRCodeOptions = {}
): void {
  const {
    width = 200,
    height = 200,
    colorDark = "#000000",
    colorLight = "#ffffff",
    correctLevel = 2, // Medium error correction
  } = options;

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  // Get canvas context
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get canvas context');
  }

  // For now, create a simple placeholder QR code pattern
  // In production, this would use a proper QR code library like qrcode.js
  createPlaceholderQRCode(ctx, data, width, height, colorDark, colorLight);
}

function createPlaceholderQRCode(
  ctx: CanvasRenderingContext2D,
  data: string,
  width: number,
  height: number,
  colorDark: string,
  colorLight: string
): void {
  // Clear canvas
  ctx.fillStyle = colorLight;
  ctx.fillRect(0, 0, width, height);

  // Create a simple grid pattern as placeholder
  const moduleSize = width / 25; // 25x25 grid
  ctx.fillStyle = colorDark;

  // Draw border
  ctx.fillRect(0, 0, width, moduleSize);
  ctx.fillRect(0, height - moduleSize, width, moduleSize);
  ctx.fillRect(0, 0, moduleSize, height);
  ctx.fillRect(width - moduleSize, 0, moduleSize, height);

  // Draw corner markers (finder patterns)
  drawFinderPattern(ctx, moduleSize, moduleSize, moduleSize * 7, colorDark, colorLight);
  drawFinderPattern(ctx, width - moduleSize * 8, moduleSize, moduleSize * 7, colorDark, colorLight);
  drawFinderPattern(ctx, moduleSize, height - moduleSize * 8, moduleSize * 7, colorDark, colorLight);

  // Draw some data pattern based on the input string
  const hash = simpleHash(data);
  for (let i = 0; i < 100; i++) {
    const x = ((hash + i * 7) % 23) + 1;
    const y = ((hash + i * 11) % 23) + 1;
    
    if (x > 8 && y > 8 && x < 17 && y < 17) {
      ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
    }
  }

  // Add text indicator (for debugging/placeholder purposes)
  ctx.fillStyle = colorLight;
  ctx.font = `${moduleSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('QR', width / 2, height / 2 + moduleSize / 2);
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colorDark: string,
  colorLight: string
): void {
  const moduleSize = size / 7;
  
  // Outer black square
  ctx.fillStyle = colorDark;
  ctx.fillRect(x, y, size, size);
  
  // Inner white square
  ctx.fillStyle = colorLight;
  ctx.fillRect(x + moduleSize, y + moduleSize, size - 2 * moduleSize, size - 2 * moduleSize);
  
  // Center black square
  ctx.fillStyle = colorDark;
  ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function downloadQRCode(canvas: HTMLCanvasElement, filename: string = 'qr-code'): void {
  try {
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create blob from canvas');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw new Error('Failed to download QR code');
  }
}

export function getQRCodeDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export function validateQRCodeData(data: string): boolean {
  // Basic validation for QR code data
  if (!data || typeof data !== 'string') {
    return false;
  }
  
  // Check length (QR codes have limits based on error correction level)
  if (data.length > 2000) {
    return false;
  }
  
  return true;
}

export function parseVisitorQRData(qrData: string): {
  visitorId?: number;
  visitRequestId?: number;
  badgeNumber?: string;
} | null {
  try {
    const parsed = JSON.parse(qrData);
    
    if (parsed.visitorId && parsed.visitRequestId && parsed.badgeNumber) {
      return {
        visitorId: parsed.visitorId,
        visitRequestId: parsed.visitRequestId,
        badgeNumber: parsed.badgeNumber,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
}
