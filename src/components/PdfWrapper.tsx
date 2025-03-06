"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker URL (using a specific version)
const pdfjsVersion = '3.11.174';
const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

interface PDFJSWrapperProps {
    pdfBytes: Uint8Array;
    scale: number;
    currentPage: number;
    onPdfLoad: (doc: any, dimensions: { width: number; height: number }, pages: number) => void;
    onPageChange: (pageNum: number) => void;
}

const PDFJSWrapper: React.FC<PDFJSWrapperProps> = ({
    pdfBytes,
    scale,
    currentPage,
    onPdfLoad,
    onPageChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isWorkerInitialized, setIsWorkerInitialized] = useState(false);
    const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initWorker = () => {
            try {
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
                setIsWorkerInitialized(true);
            } catch (err) {
                console.error('Error initializing PDF.js worker:', err);
                setError('Failed to initialize PDF viewer. Please try again.');
            }
        };

        initWorker();
    }, []);

    useEffect(() => {
        if (!isWorkerInitialized || !pdfBytes) return;

        const loadPdf = async () => {
            try {
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const loadingTask = pdfjsLib.getDocument({ url });
                const pdf = await loadingTask.promise;
                setPdfDocument(pdf);
                onPdfLoad(pdf, { width: 0, height: 0 }, pdf.numPages);
                return () => URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError('Failed to load PDF. The file might be corrupted or unsupported.');
            }
        };

        loadPdf();
    }, [pdfBytes, isWorkerInitialized]);

    useEffect(() => {
        if (!pdfDocument || !canvasRef.current) return;

        const renderPage = async () => {
            try {
                if (!canvasRef.current) {
                    throw new Error('Canvas reference is not available');
                }

                const page = await pdfDocument.getPage(currentPage);
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (!context) {
                    throw new Error('Failed to get canvas 2D context');
                }

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Ensure pdfDocument is not null before calling onPdfLoad
                if (pdfDocument) {
                    onPdfLoad(pdfDocument, {
                        width: viewport.width,
                        height: viewport.height
                    }, pdfDocument.numPages);
                }

                await page.render({
                    canvasContext: context,
                    viewport
                }).promise;
            } catch (err) {
                console.error('Error rendering PDF page:', err);
                setError(err instanceof Error ? err.message : 'Failed to render page. Please try a different PDF.');
            }
        };

        renderPage();
    }, [pdfDocument, currentPage, scale]);

    useEffect(() => {
        if (pdfDocument) {
            onPageChange(currentPage);
        }
    }, [currentPage, pdfDocument]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                {error}
            </div>
        );
    }

    return <canvas ref={canvasRef} className="mx-auto" />;
};

export default PDFJSWrapper;
