"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Upload, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isOpen?: boolean;
}

export function QRScanner({ onScan, isOpen = true }: QRScannerProps) {
  const scannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    let html5QrCodeScanner: any = null;

    const startScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");

        // Clear existing instance if any
        if (scannerRef.current) {
          try {
            await scannerRef.current.clear();
          } catch {
            // ignore cleanup error
          }
        }

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
            // Optionally clear after successful scan
            try {
              html5QrCodeScanner.clear();
              setCameraActive(false);
            } catch {
              // ignore
            }
          },
          (error: any) => {
            // Frame level scan noise - safe to ignore
          }
        );

        scannerRef.current = html5QrCodeScanner;
        setIsScanning(true);
        setCameraActive(true);
        setScanError(null);
      } catch (err: any) {
        console.error("Failed to initialize scanner:", err);
        setScanError("Camera access failed. Check browser permissions or upload a QR image.");
        setIsScanning(false);
        setCameraActive(false);
      }
    };

    if (isOpen) {
      startScanner();
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, [isOpen, onScan]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Camera QR Scanner</h3>
            <p className="text-[11px] text-slate-500">
              Hold the student wallet QR code in front of your camera or choose an image
            </p>
          </div>
        </div>
        {cameraActive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Camera Active
          </span>
        )}
      </div>

      {scanError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{scanError}</span>
        </div>
      )}

      {/* html5-qrcode target box */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[300px] flex items-center justify-center border border-slate-800">
        <div id="qr-scanner-box" className="w-full text-slate-100" />
      </div>

      <p className="text-[11px] text-slate-400 text-center mt-3">
        Powered by <code className="text-slate-600 font-mono">html5-qrcode</code> · Works with webcams, phone cameras, and PNG/JPEG uploads
      </p>
    </div>
  );
}
export default QRScanner;
