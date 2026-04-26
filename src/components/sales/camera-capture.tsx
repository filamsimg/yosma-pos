'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeotagData, processGeotaggedImage } from '@/lib/utils/image-utils';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  geotagData: GeotagData;
  isLocationReady: boolean;
}

export function CameraCapture({ onCapture, onCancel, geotagData, isLocationReady }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: {理想: 1280 },
          height: {理想: 720 }
        }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !isLocationReady) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to file for processing
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        try {
          const processedBlob = await processGeotaggedImage(file, geotagData);
          setCapturedImage(URL.createObjectURL(processedBlob));
        } catch (err) {
          console.error('Image processing error:', err);
          setError('Gagal memproses gambar.');
        }
      }
      setIsProcessing(false);
    }, 'image/jpeg', 0.9);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => onCapture(blob));
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onCancel} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
          <MapPin className={`h-4 w-4 ${isLocationReady ? 'text-green-400' : 'text-red-400'}`} />
          <span className="text-white text-xs font-medium">
            {isLocationReady ? 'GPS Terkunci' : 'Mencari GPS...'}
          </span>
        </div>
      </div>

      {/* Main View */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <img src={capturedImage} className="w-full h-full object-contain" alt="Captured" />
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            {/* Silhouette / Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[60%] border-2 border-white/50 rounded-3xl relative overflow-hidden flex items-center justify-center">
                {/* Subtle Head Silhouette */}
                <svg viewBox="0 0 100 100" className="w-48 h-48 text-white/20 fill-current">
                  <path d="M50 20C40 20 32 28 32 38C32 48 40 56 50 56C60 56 68 48 68 38C68 28 60 20 50 20ZM50 62C35 62 20 70 20 80V85H80V80C80 70 65 62 50 62Z" />
                </svg>
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
              </div>
            </div>

            {/* Instruction */}
            <div className="absolute bottom-32 left-0 right-0 text-center px-6">
              <p className="text-white text-sm bg-black/40 backdrop-blur-md py-2 px-4 rounded-full inline-block border border-white/10 shadow-lg">
                Posisikan wajah atau toko di dalam bingkai
              </p>
            </div>
          </>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 text-center">
            <div className="bg-white p-6 rounded-2xl max-w-sm">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-900 font-medium mb-4">{error}</p>
              <Button onClick={onCancel} className="w-full">Tutup</Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-around pb-12">
        {capturedImage ? (
          <>
            <button 
              onClick={handleRetake}
              className="flex flex-col items-center gap-2 text-white opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <RefreshCw className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Ulangi</span>
            </button>
            <button 
              onClick={handleConfirm}
              className="flex flex-col items-center gap-2 text-white hover:text-green-400 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Check className="h-10 w-10 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Simpan Foto</span>
            </button>
            <div className="w-14 h-14" /> {/* Spacer */}
          </>
        ) : (
          <>
            <div className="w-14 h-14" /> {/* Spacer */}
            <button 
              onClick={handleCapture}
              disabled={!isLocationReady || isProcessing}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isLocationReady 
                  ? 'bg-blue-600 active:scale-90 shadow-lg shadow-blue-500/40' 
                  : 'bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
                   <div className="w-12 h-12 rounded-full bg-white" />
                </div>
              )}
            </button>
            <div className="w-14 h-14" /> {/* Spacer */}
          </>
        )}
      </div>
    </div>
  );
}
