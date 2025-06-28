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

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await initializeCamera();
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      console.error('Camera initialization error:', err);
    }
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && isStreaming) {
      try {
        const photoData = capturePhoto(videoRef.current);
        setCapturedPhoto(photoData);
      } catch (err) {
        setError('Failed to capture photo. Please try again.');
        console.error('Photo capture error:', err);
      }
    }
  }, [isStreaming]);

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setError(null);
  }, []);

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
    onClose();
  }, [stream, onClose]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !isStreaming && !capturedPhoto) {
      startCamera();
    }
  }, [isOpen, isStreaming, capturedPhoto, startCamera]);

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
                {isStreaming ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                    {/* Overlay guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-white rounded-full opacity-50"></div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-white">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Initializing camera...</p>
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
