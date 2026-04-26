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
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-sans">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex flex-col gap-1">
          <h2 className="text-white text-lg font-black tracking-tight leading-none">
            On-site Verification
          </h2>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
            Photo Proof System
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <button onClick={onCancel} className="text-white/80 p-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md bg-white/5 border border-white/10">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isLocationReady ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
            <span className="text-white text-[10px] font-black uppercase tracking-wider">
              {isLocationReady ? 'GPS LOCKED' : 'SEARCHING GPS...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main View */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center p-4">
            <img src={capturedImage} className="w-full h-full object-contain rounded-2xl shadow-2xl border border-white/10" alt="Captured" />
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
            />
            
            {/* Professional Overlay / Frame */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="relative w-[85%] aspect-[3/4] max-h-[60vh] border-[1px] border-white/30 rounded-[2.5rem] shadow-[0_0_0_2000px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
                
                {/* Subtle Human Silhouette */}
                <svg viewBox="0 0 100 100" className="w-48 h-48 text-white/10 fill-current mb-12">
                  <path d="M50 20C40 20 32 28 32 38C32 48 40 56 50 56C60 56 68 48 68 38C68 28 60 20 50 20ZM50 62C35 62 20 70 20 80V85H80V80C80 70 65 62 50 62Z" />
                </svg>

                {/* Corner Brackets (Glowing) */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-blue-500 rounded-tl-[2rem] shadow-[-2px_-2px_10px_rgba(59,130,246,0.5)]" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-blue-500 rounded-tr-[2rem] shadow-[2px_-2px_10px_rgba(59,130,246,0.5)]" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-blue-500 rounded-bl-[2rem] shadow-[-2px_2px_10px_rgba(59,130,246,0.5)]" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-blue-500 rounded-br-[2rem] shadow-[2px_2px_10px_rgba(59,130,246,0.5)]" />

                {/* Center Target */}
                <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                
                {/* Overlay Label */}
                <div className="absolute bottom-10 px-4 py-2 bg-blue-600/90 backdrop-blur-md rounded-lg border border-blue-400/50 shadow-xl">
                  <p className="text-white text-[9px] font-black uppercase tracking-[0.15em]">
                    Position Subject Here
                  </p>
                </div>
              </div>

              {/* Instruction Text */}
              <div className="mt-12 px-8 text-center">
                <p className="text-white/80 text-xs font-bold leading-relaxed max-w-[240px]">
                  Posisikan wajah Anda atau outlet dengan jelas di dalam bingkai biru.
                </p>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 z-50">
            <div className="bg-white p-8 rounded-[2rem] max-w-sm shadow-2xl">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-slate-900 text-lg font-black text-center mb-2">Akses Kamera Terhambat</h3>
              <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">Pastikan Anda telah memberikan izin kamera di pengaturan browser Anda.</p>
              <Button onClick={onCancel} className="w-full h-12 bg-slate-900 rounded-xl font-bold">Kembali ke Menu</Button>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-10 pb-14 bg-gradient-to-t from-black via-black/60 to-transparent flex items-center justify-between z-30">
        {capturedImage ? (
          <>
            <button 
              onClick={handleRetake}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md group-active:scale-90 transition-all">
                <RefreshCw className="h-6 w-6 text-white/70" />
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Retake</span>
            </button>

            <button 
              onClick={handleConfirm}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] group-active:scale-95 transition-all">
                <Check className="h-10 w-10 text-slate-950" />
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Confirm & Save</span>
            </button>

            <div className="w-14 h-14" /> {/* Balanced Spacer */}
          </>
        ) : (
          <>
            <div className="w-14 h-14" /> {/* Balanced Spacer */}
            
            <button 
              onClick={handleCapture}
              disabled={!isLocationReady || isProcessing}
              className="group relative"
            >
              {/* Outer Ring */}
              <div className={`w-24 h-24 rounded-full border-[3px] flex items-center justify-center transition-all duration-500 ${
                isLocationReady 
                ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                : 'border-white/10'
              }`}>
                {/* Inner Shutter Button */}
                <div className={`rounded-full transition-all duration-300 ${
                  isLocationReady 
                  ? 'w-18 h-18 bg-white shadow-xl group-active:scale-90' 
                  : 'w-12 h-12 bg-white/10'
                } flex items-center justify-center`}>
                   {isProcessing && <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />}
                </div>
              </div>
              
              {!isLocationReady && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full">
                  GPS REQUIRED
                </div>
              )}
            </button>

            <div className="w-14 h-14" /> {/* Balanced Spacer */}
          </>
        )}
      </div>
    </div>
  );
}
