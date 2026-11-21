"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, AlertCircle, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isOpen?: boolean;
}

export function QRScanner({ onScan, isOpen = true }: QRScannerProps) {
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");
  const scannerRef = useRef<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera scanner when in camera mode
  useEffect(() => {
    let html5QrCodeScanner: any = null;

    if (isOpen && scanMode === "camera") {
      import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {
            // ignore
          }
        }

        try {
          html5QrCodeScanner = new Html5QrcodeScanner(
            "qr-scanner-box",
            {
              fps: 10,
              qrbox: { width: 260, height: 260 },
              aspectRatio: 1.0,
              showTorchButtonIfSupported: true,
              showZoomSliderIfSupported: true,
            },
            /* verbose= */ false
          );

          html5QrCodeScanner.render(
            (decodedText: string) => {
              onScan(decodedText);
              try {
                html5QrCodeScanner.clear();
                setCameraActive(false);
              } catch {
                // ignore
              }
            },
            () => {
              // frame drop noise
            }
          );

          scannerRef.current = html5QrCodeScanner;
          setCameraActive(true);
          setScanError(null);
        } catch (err: any) {
          console.error("Failed to initialize camera scanner:", err);
          setScanError("Camera access failed. Check browser permissions or upload a QR image.");
          setCameraActive(false);
        }
      });
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, scanMode, onScan]);

  // Handle uploading and decoding a QR image file
  const handleFileScan = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setScanError("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }

    setIsProcessingFile(true);
    setScanError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-hidden-file-reader");
      
      const decodedText = await html5QrCode.scanFile(file, true);
      onScan(decodedText);
      try {
        await html5QrCode.clear();
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.warn("QR scan failed on uploaded file:", err);
      setScanError("No valid QR code detected in this image. Please upload a clear, high-resolution QR photo.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileScan(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
      {/* Sub-mode switcher: Camera vs Upload Photo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">QR Code Verifier</h3>
          <p className="text-xs text-slate-500">Scan candidate presentation via webcam or upload a QR image</p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => {
              setScanMode("camera");
              setScanError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scanMode === "camera"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => {
              setScanMode("upload");
              setScanError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scanMode === "upload"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {scanError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{scanError}</span>
        </div>
      )}

      {/* Hidden element for file scanning */}
      <div id="qr-hidden-file-reader" className="hidden" />

      {/* 1. Camera Mode */}
      {scanMode === "camera" && (
        <div>
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[300px] flex items-center justify-center border border-slate-800">
            <div id="qr-scanner-box" className="w-full text-slate-100" />
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Hold the QR code steady in front of your camera. Or switch to &quot;Upload Photo&quot; above.
          </p>
        </div>
      )}

      {/* 2. Upload QR Photo Mode */}
      {scanMode === "upload" && (
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition flex flex-col items-center justify-center ${
              dragOver
                ? "border-indigo-500 bg-indigo-50/50"
                : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileScan(e.target.files[0]);
                }
              }}
            />

            {isProcessingFile ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-700">Decoding QR code from image...</p>
                <p className="text-xs text-slate-500 mt-1">Extracting cryptographic SD-JWT payload</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Upload or Drag &amp; Drop QR Photo
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  Select a photo, screenshot, or downloaded QR code image (PNG, JPG, WEBP)
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image File</span>
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Supports downloaded QR images directly from student wallet shares.
          </p>
        </div>
      )}
    </div>
  );
}
export default QRScanner;
