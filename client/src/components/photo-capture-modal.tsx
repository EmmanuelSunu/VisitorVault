import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw } from "lucide-react";
import { initializeCamera, capturePhoto, stopCamera } from "@/lib/camera-utils";

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoData: string) => void;
}

export default function PhotoCaptureModal({ isOpen, onClose, onCapture }: PhotoCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const timeoutRefs = useRef<{ force?: NodeJS.Timeout; error?: NodeJS.Timeout; countdown?: NodeJS.Timeout }>({});

  // Start countdown timer (30 seconds)
  const startCountdownTimer = useCallback(() => {
    if (timeoutRefs.current.countdown) {
      clearInterval(timeoutRefs.current.countdown);
    }
    
    setCountdown(30);
    timeoutRefs.current.countdown = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timeoutRefs.current.countdown!);
          setError('Time expired. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Stop countdown timer
  const stopCountdownTimer = useCallback(() => {
    if (timeoutRefs.current.countdown) {
      clearInterval(timeoutRefs.current.countdown);
      timeoutRefs.current.countdown = undefined;
    }
    setCountdown(0);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsStreaming(false);
      console.log('Starting camera...');
      
      const mediaStream = await initializeCamera();
      console.log('Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        console.log('Setting video srcObject and attempting to play...');
        
        // Simple approach: set autoplay and directly try to play
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        // Use a more direct approach
        const playVideo = async () => {
          try {
            await video.play();
            console.log('Video playing successfully');
            setIsStreaming(true);
          } catch (err) {
            console.error('Error playing video:', err);
            setError('Failed to start video stream.');
          }
        };

        // Try to play immediately
        playVideo();
        
        // Also listen for the loadedmetadata event as backup
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded, video ready state:', video.readyState);
          console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          if (!isStreaming) {
            playVideo();
          }
        };

        // Listen for playing event
        const handlePlaying = () => {
          console.log('Video playing event fired');
          setIsStreaming(true);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('playing', handlePlaying);
        
        // Clear any existing timeouts
        if (timeoutRefs.current.force) clearTimeout(timeoutRefs.current.force);
        if (timeoutRefs.current.error) clearTimeout(timeoutRefs.current.error);
        
        // Set a very short timeout to force streaming state
        timeoutRefs.current.force = setTimeout(() => {
          console.log('Force timeout - current streaming state:', isStreaming);
          console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          console.log('Video ready state:', video.readyState);
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('Video has dimensions, forcing streaming state');
            setIsStreaming(true);
            startCountdownTimer();
          } else if (stream && stream.active) {
            console.log('Stream is active, forcing streaming state anyway');
            setIsStreaming(true);
            startCountdownTimer();
          }
        }, 1000);
        
        // Set a longer timeout for errors (only if stream isn't working)
        timeoutRefs.current.error = setTimeout(() => {
          if (!isStreaming && (!stream || !stream.active)) {
            console.error('Camera initialization timeout');
            setError('Camera initialization took too long. Please try again.');
          }
        }, 10000);
        
        // Cleanup function
        return () => {
          if (timeoutRefs.current.force) clearTimeout(timeoutRefs.current.force);
          if (timeoutRefs.current.error) clearTimeout(timeoutRefs.current.error);
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('playing', handlePlaying);
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera. Please check permissions.');
    }
  }, [isStreaming]);

  const handleCapture = useCallback(() => {
    console.log('Capture button clicked - current state:', { 
      hasVideoRef: !!videoRef.current, 
      isStreaming, 
      videoReadyState: videoRef.current?.readyState,
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight
    });
    
    if (videoRef.current && isStreaming) {
      try {
        const photoData = capturePhoto(videoRef.current);
        setCapturedPhoto(photoData);
        stopCountdownTimer();
        console.log('Photo captured successfully');
      } catch (err) {
        setError('Failed to capture photo. Please try again.');
        console.error('Photo capture error:', err);
      }
    } else {
      console.log('Cannot capture: video element or streaming not ready');
      setError('Camera not ready. Please wait a moment and try again.');
    }
  }, [isStreaming]);

  const handleRetake = useCallback(() => {
    console.log('Retaking photo - resetting to camera mode');
    setCapturedPhoto(null);
    setError(null);
    stopCountdownTimer();
    
    // Clear any existing timeouts
    if (timeoutRefs.current.force) {
      clearTimeout(timeoutRefs.current.force);
      timeoutRefs.current.force = undefined;
    }
    if (timeoutRefs.current.error) {
      clearTimeout(timeoutRefs.current.error);
      timeoutRefs.current.error = undefined;
    }
    
    // Simply restart the camera fresh - this is more reliable than trying to reuse stream
    if (stream) {
      console.log('Stopping existing stream for fresh restart');
      stopCamera(stream);
      setStream(null);
      setIsStreaming(false);
    }
    
    // Start camera fresh
    setTimeout(() => {
      console.log('Starting fresh camera for retake');
      startCamera();
    }, 100);
  }, [stream, startCamera, stopCountdownTimer]);

  const handleUsePhoto = useCallback(() => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      handleClose();
    }
  }, [capturedPhoto, onCapture]);

  const handleClose = useCallback(() => {
    if (stream) {
      stopCamera(stream);
      setStream(null);
    }
    setIsStreaming(false);
    setCapturedPhoto(null);
    setError(null);
    stopCountdownTimer();
    onClose();
  }, [stream, onClose, stopCountdownTimer]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !stream && !capturedPhoto) {
      console.log('Modal opened, starting camera...');
      startCamera();
    }
    
    // Cleanup on close
    return () => {
      if (!isOpen && stream) {
        console.log('Modal closed, stopping camera...');
        stopCamera(stream);
        setStream(null);
        setIsStreaming(false);
      }
    };
  }, [isOpen, stream, capturedPhoto, startCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Capture Visitor Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Camera Preview or Captured Photo */}
          <div className="relative">
            {capturedPhoto ? (
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                <img
                  src={capturedPhoto}
                  alt="Captured photo"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  style={{ display: 'block' }}
                />
                {/* Overlay guide and countdown - only show when streaming */}
                {isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-white rounded-full opacity-50"></div>
                    {/* Countdown timer */}
                    {countdown > 0 && (
                      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold">{countdown}</div>
                          <div className="text-xs">seconds</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Loading overlay - only show when not streaming */}
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
                    <div className="text-center text-white">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Initializing camera...</p>
                      <p className="text-sm mt-2 opacity-75">
                        Stream: {stream ? 'Active' : 'None'} | 
                        Streaming: {isStreaming ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Instructions */}
          {!capturedPhoto && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Photo Requirements:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Position yourself in the center of the frame</li>
                <li>• Ensure good lighting and avoid shadows</li>
                <li>• Remove hats and sunglasses</li>
                <li>• Use a plain background if possible</li>
                <li>• Look directly at the camera</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between space-x-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            
            <div className="flex space-x-2">
              {capturedPhoto ? (
                <>
                  <Button variant="outline" onClick={handleRetake}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                  <Button onClick={handleUsePhoto}>
                    Use Photo
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleCapture} 
                  disabled={!isStreaming || !!error}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
