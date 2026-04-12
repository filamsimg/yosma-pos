'use client';

import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { IMAGE_COMPRESSION_OPTIONS } from '@/lib/constants';

interface ImageCaptureState {
  file: File | null;
  preview: string | null;
  compressedFile: File | null;
  loading: boolean;
  error: string | null;
}

export function useImageCapture() {
  const [state, setState] = useState<ImageCaptureState>({
    file: null,
    preview: null,
    compressedFile: null,
    loading: false,
    error: null,
  });

  const processImage = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Create preview from original
      const previewUrl = URL.createObjectURL(file);

      // Compress the image
      const compressedFile = await imageCompression(
        file,
        IMAGE_COMPRESSION_OPTIONS
      );

      setState({
        file,
        preview: previewUrl,
        compressedFile,
        loading: false,
        error: null,
      });

      return compressedFile;
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Gagal mengompresi gambar. Silakan coba lagi.',
      }));
      return null;
    }
  }, []);

  const clearImage = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview);
    }
    setState({
      file: null,
      preview: null,
      compressedFile: null,
      loading: false,
      error: null,
    });
  }, [state.preview]);

  return { ...state, processImage, clearImage };
}
