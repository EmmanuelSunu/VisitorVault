// Camera utilities for photo capture functionality

export interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export async function initializeCamera(constraints: CameraConstraints = {}): Promise<MediaStream> {
  const {
    width = 640,
    height = 480,
    facingMode = 'user'
  } = constraints;

  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera not supported by this browser');
  }

  console.log('Requesting camera access with constraints:', { width, height, facingMode });

  try {
    // Try with ideal constraints first
    let mediaConstraints: MediaStreamConstraints = {
      video: {
        width: { ideal: width },
        height: { ideal: height },
        facingMode: facingMode
      },
      audio: false
    };

    console.log('Attempting getUserMedia with ideal constraints...');
    let stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    console.log('Camera stream obtained successfully:', stream);
    return stream;
  } catch (error) {
    console.warn('Failed with ideal constraints, trying basic constraints...', error);
    
    // Fallback to basic constraints
    try {
      const basicConstraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode
        },
        audio: false
      };
      
      console.log('Attempting getUserMedia with basic constraints...');
      const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      console.log('Camera stream obtained with basic constraints:', stream);
      return stream;
    } catch (fallbackError) {
      console.error('Error accessing camera:', fallbackError);
      
      if (fallbackError instanceof Error) {
        switch (fallbackError.name) {
          case 'NotAllowedError':
            throw new Error('Camera access denied. Please allow camera permissions and try again.');
          case 'NotFoundError':
            throw new Error('No camera found on this device.');
          case 'NotReadableError':
            throw new Error('Camera is currently in use by another application.');
          case 'OverconstrainedError':
            throw new Error('Camera does not support the requested configuration.');
          default:
            throw new Error(`Camera error: ${fallbackError.message}`);
        }
      }
    }
    
    throw new Error('Failed to access camera');
  }
}

export function capturePhoto(videoElement: HTMLVideoElement): string {
  console.log('capturePhoto called with video:', {
    readyState: videoElement.readyState,
    HAVE_ENOUGH_DATA: videoElement.HAVE_ENOUGH_DATA,
    videoWidth: videoElement.videoWidth,
    videoHeight: videoElement.videoHeight,
    currentTime: videoElement.currentTime,
    paused: videoElement.paused
  });

  if (!videoElement) {
    throw new Error('Video element is required');
  }

  if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    throw new Error(`Video not ready for capture. Ready state: ${videoElement.readyState}, required: ${videoElement.HAVE_ENOUGH_DATA}`);
  }

  // Create canvas element
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Unable to get canvas context');
  }

  // Set canvas dimensions to match video
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Draw the current video frame to canvas
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Convert to data URL (base64 encoded image)
  return canvas.toDataURL('image/jpeg', 0.8);
}

export function stopCamera(stream: MediaStream): void {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
}

export function getCameraDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return Promise.reject(new Error('Device enumeration not supported'));
  }

  return navigator.mediaDevices.enumerateDevices()
    .then(devices => devices.filter(device => device.kind === 'videoinput'));
}

export function switchCamera(currentStream: MediaStream, deviceId: string): Promise<MediaStream> {
  // Stop current stream
  stopCamera(currentStream);

  // Start new stream with specified device
  return initializeCamera({
    facingMode: undefined // Don't use facingMode when using specific deviceId
  }).then(stream => {
    // Note: In a real implementation, you'd need to modify the constraints
    // to include the specific deviceId
    return stream;
  });
}

export function createPhotoBlob(dataURL: string): Blob {
  // Convert data URL to blob
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

export function validatePhotoQuality(dataURL: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check if data URL is valid
  if (!dataURL || !dataURL.startsWith('data:image/')) {
    issues.push('Invalid image format');
    return { isValid: false, issues };
  }

  // Check file size (approximate from base64)
  const base64Length = dataURL.split(',')[1]?.length || 0;
  const sizeInBytes = (base64Length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB < 0.1) {
    issues.push('Image quality too low (file size too small)');
  }
  
  if (sizeInMB > 10) {
    issues.push('Image file size too large (max 10MB)');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

export function resizePhoto(dataURL: string, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Unable to get canvas context'));
        return;
      }

      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert back to data URL
      const resizedDataURL = canvas.toDataURL('image/jpeg', quality);
      resolve(resizedDataURL);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = dataURL;
  });
}
