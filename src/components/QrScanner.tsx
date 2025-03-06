"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import useSound from 'use-sound';
import { toast } from 'react-toastify';

interface QRScannerProps {
    onScan: (data: string, parsedData?: any) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
    const [lastScanned, setLastScanned] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const html5QrCode = useRef<Html5Qrcode | null>(null);
    const scanTimeout = useRef<NodeJS.Timeout | null>(null);
    const isProcessing = useRef(false);

    useEffect(() => {
        html5QrCode.current = new Html5Qrcode("qr-reader", {
            verbose: false,
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        });

        return () => {
            if (html5QrCode.current?.isScanning) {
                html5QrCode.current.stop().catch(console.error);
            }
            html5QrCode.current?.clear();
        };
    }, []);

    const handleSuccessfulScan = useCallback((decodedText: string) => {
        if (lastScanned === decodedText || isProcessing.current) return;

        isProcessing.current = true;
        console.log('QR Code Scanned:', decodedText);
        setLastScanned(decodedText);
        setError("");

        let parsedData = undefined;
        try {
            if ((decodedText.startsWith('{') && decodedText.endsWith('}')) ||
                (decodedText.startsWith('[') && decodedText.endsWith(']'))) {
                parsedData = JSON.parse(decodedText);
                console.log('Parsed QR Data:', parsedData);
            }
        } catch (error) {
            console.log("QR data is not valid JSON, using as raw string");
        }

        // Show success UI
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Call the onScan callback
        onScan(decodedText, parsedData);

        // Reset after 3 seconds
        scanTimeout.current = setTimeout(() => {
            setLastScanned("");
            isProcessing.current = false;
        }, 3000);
    }, [lastScanned, onScan]);

    const startScanning = useCallback(async () => {
        if (!html5QrCode.current) return;

        try {
            setIsLoading(true);
            await html5QrCode.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: 1.0,
                    disableFlip: false,
                },
                handleSuccessfulScan,
                (errorMessage) => {
                    if (!errorMessage.includes("NotFound")) {
                        setError(errorMessage);
                    }
                }
            );
            setIsCameraActive(true);
        } catch (err) {
            setError("Failed to start camera: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [handleSuccessfulScan]);

    const stopScanning = useCallback(async () => {
        if (!html5QrCode.current?.isScanning) return;

        try {
            await html5QrCode.current.stop();
            setIsCameraActive(false);
            setError("");
        } catch (err) {
            console.error("Failed to stop camera:", err);
        }
    }, []);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (scanTimeout.current) {
                clearTimeout(scanTimeout.current);
            }
        };
    }, []);

    return (
        <div className="w-full mx-auto p-6 border rounded-lg bg-white shadow-lg space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-2xl text-gray-800">QR Code Scanner</h3>
                <button
                    onClick={() => isCameraActive ? stopScanning() : startScanning()}
                    className={`px-5 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 ${isCameraActive
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200'
                        } shadow-lg`}
                    disabled={isLoading}
                >
                    {isCameraActive ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" />
                            </svg>
                            Stop Camera
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Start Camera
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            {isLoading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Initializing camera...</p>
                </div>
            )}

            <div id="qr-reader" className="rounded-lg overflow-hidden shadow-md"></div>

            {showSuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                    <div className="bg-white rounded-xl p-8 shadow-2xl transform animate-bounce">
                        <div className="flex items-center gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-2xl font-semibold text-green-700">Scan Successful!</span>
                        </div>
                    </div>
                </div>
            )}

            {lastScanned && (
                <div className="p-5 bg-green-50 border-2 border-green-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 text-green-700 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="font-medium text-lg">Successfully Scanned!</p>
                    </div>
                    <pre className="text-sm mt-2 overflow-x-auto whitespace-pre-wrap break-all bg-white p-4 rounded-lg border border-green-100">
                        {lastScanned}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default QRScanner;