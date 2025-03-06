"use client";

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

// Dynamically import PDF.js wrapper to avoid SSR issues
const PDFJSWrapper = dynamic(() => import('./PdfWrapper'), {
    ssr: false,
    loading: () => <div className="flex h-64 items-center justify-center">Loading PDF viewer...</div>
});

interface Annotation {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    fontSize: number;
    editing: boolean;
    page: number; // page number (1-indexed)
    type: 'text' | 'signature';
    signatureData?: string; // Base64 encoded signature image data
}

interface DraggableAnnotationProps {
    annotation: Annotation;
    onUpdate: (ann: Annotation) => void;
    onDelete: (id: string) => void;
    scale: number;
}

// Signature Pad Component
// Signature Pad Component with transparent background
const SignaturePad = ({ onSave, onCancel }: { onSave: (dataUrl: string) => void, onCancel: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Ensure the canvas is created with alpha support for transparency
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) return;

        // Set up canvas drawing settings
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.strokeStyle = 'black';

        // Clear the canvas (this will clear to transparent, not white)
        context.clearRect(0, 0, canvas.width, canvas.height);

        setCtx(context);
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!ctx) return;
        setIsDrawing(true);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !ctx) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!ctx) return;
        setIsDrawing(false);
        ctx.closePath();
    };

    // Update clearCanvas to clear to transparency instead of filling with white
    const clearCanvas = () => {
        if (!ctx || !canvasRef.current) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const saveSignature = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <Card className="p-4 shadow-lg">
            <div className="text-center mb-2">
                <h3 className="font-medium">Draw Your Signature</h3>
            </div>
            <div className="border border-gray-300 mb-3 bg-white">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="touch-none"
                />
            </div>
            <div className="flex justify-between">
                <Button variant="outline" onClick={clearCanvas} size="sm">
                    Clear
                </Button>
                <div className="space-x-2">
                    <Button variant="outline" onClick={onCancel} size="sm">
                        Cancel
                    </Button>
                    <Button onClick={saveSignature} size="sm">
                        Save
                    </Button>
                </div>
            </div>
        </Card>
    );
};


const DraggableAnnotation = ({ annotation, onUpdate, onDelete, scale }: DraggableAnnotationProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [showSignaturePad, setShowSignaturePad] = useState(false);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        setIsDragging(true);
        setOffset({
            x: e.clientX - annotation.x,
            y: e.clientY - annotation.y
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - offset.x;
        const newY = e.clientY - offset.y;
        onUpdate({ ...annotation, x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, offset]);

    const textStyles = {
        color: annotation.color,
        fontSize: `${annotation.fontSize}px`,
        fontFamily: 'Helvetica, Arial, sans-serif',
        lineHeight: '1.2'
    };

    const saveSignature = (dataUrl: string) => {
        onUpdate({ ...annotation, signatureData: dataUrl, editing: false });
        setShowSignaturePad(false);
    };

    const cancelSignature = () => {
        setShowSignaturePad(false);
    };

    // Signature specific editing view
    if (annotation.type === 'signature' && annotation.editing) {
        return (
            <div
                className="absolute z-50"
                style={{ top: annotation.y, left: annotation.x }}
            >
                {showSignaturePad ? (
                    <SignaturePad onSave={saveSignature} onCancel={cancelSignature} />
                ) : (
                    <Card className="p-4 shadow-lg w-64 bg-opacity-50 backdrop-blur-sm bg-white">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setShowSignaturePad(true)}
                                    className="bg-opacity-90 hover:bg-opacity-100"
                                >
                                    Draw Signature
                                </Button>
                                {annotation.signatureData && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onUpdate({ ...annotation, editing: false })}
                                        className="bg-opacity-50 hover:bg-opacity-75"
                                    >
                                        Done
                                    </Button>
                                )}
                            </div>
                            <div className="flex justify-between mt-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="bg-red-500 bg-opacity-75 hover:bg-opacity-100"
                                    onClick={() => onDelete(annotation.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        );
    }

    // Text annotation editing view
    if (annotation.type === 'text' && annotation.editing) {
        return (
            <div
                className="absolute z-50"
                style={{ top: annotation.y, left: annotation.x }}
            >
                <Card className="p-4 shadow-lg w-64">
                    <div className="space-y-4">
                        <Input
                            type="text"
                            value={annotation.text}
                            onChange={(e) => onUpdate({ ...annotation, text: e.target.value })}
                            className="w-full"
                            autoFocus
                        />
                        <div className="flex items-center gap-3 flex-wrap bg-white">
                            <div className="flex items-center gap-2 bg-white">
                                <Label htmlFor="fontSize" className="text-xs whitespace-nowrap">
                                    Font Size
                                </Label>
                                <Input
                                    id="fontSize"
                                    type="number"
                                    value={annotation.fontSize}
                                    onChange={(e) =>
                                        onUpdate({
                                            ...annotation,
                                            fontSize: parseInt(e.target.value) || annotation.fontSize
                                        })
                                    }
                                    className="w-16 h-8"
                                />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-8 h-8 p-0 rounded-md"
                                        style={{ backgroundColor: annotation.color }}
                                    >
                                        <span className="sr-only">Pick a color</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <HexColorPicker
                                        color={annotation.color}
                                        onChange={(color) => onUpdate({ ...annotation, color })}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex justify-between mt-2 bg-white">
                            <Button
                                variant="outline"
                                size="sm"
                                className='bg-green-500'
                                onClick={() => onUpdate({ ...annotation, editing: false })}
                            >
                                Done
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className='bg-red-500 hover:bg-red-600'
                                onClick={() => onDelete(annotation.id)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Display view (non-editing)
    return (
        <div
            className={cn(
                "absolute transition-opacity group",
                isDragging ? "cursor-grabbing opacity-80" : "cursor-grab opacity-100",
                "z-10"
            )}
            style={{ top: annotation.y, left: annotation.x }}
        >
            <div
                className="relative group"
                onMouseDown={handleMouseDown}
                onDoubleClick={() => onUpdate({ ...annotation, editing: true })}
            >
                {annotation.type === 'signature' && annotation.signatureData ? (
                    <img
                        src={annotation.signatureData}
                        alt="Signature"
                        className="select-none max-w-xs"
                        style={{ maxHeight: '100px' }}
                    />
                ) : (
                    <span className="select-none whitespace-pre-wrap" style={textStyles}>
                        {annotation.text}
                    </span>
                )}
            </div>
        </div>
    );
};

const PdfEditor = () => {
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);
    const [scale, setScale] = useState(1.5);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [history, setHistory] = useState<Annotation[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleZoom = (delta: number) => {
        const newScale = Math.round((scale + delta) * 10) / 10;
        if (newScale >= 0.5 && newScale <= 3.0) {
            setScale(newScale);
        }
    };

    const changePage = (delta: number) => {
        const newPage = currentPage + delta;
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setAnnotations(history[historyIndex - 1]);
        }
    };

    const clearAnnotations = () => {
        setAnnotations([]);
        setHistory([[]]);
        setHistoryIndex(0);
    };

    // Save annotation history
    useEffect(() => {
        if (JSON.stringify(annotations) !== JSON.stringify(history[historyIndex] || [])) {
            setHistory([...history.slice(0, historyIndex + 1), [...annotations]]);
            setHistoryIndex(historyIndex + 1);
        }
    }, [annotations]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        try {
            setIsLoading(true);
            const file = e.target.files[0];
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);

            setPdfBytes(bytes);
            setEditedPdfUrl(null);
            setAnnotations([]);
            setCurrentPage(1);
            setHistory([[]]);
            setHistoryIndex(0);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading PDF:', error);
            setIsLoading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        try {
            const files = Array.from(e.dataTransfer.files);
            const pdfFile = files.find(file =>
                file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            );

            if (!pdfFile) {
                throw new Error('Please drop a valid PDF file');
            }

            if (pdfFile.size > 10 * 1024 * 1024) { // 10MB limit
                throw new Error('PDF file size must be less than 10MB');
            }

            const fakeEvent = {
                target: {
                    files: [pdfFile]
                }
            } as unknown as React.ChangeEvent<HTMLInputElement>;

            setIsLoading(true);
            await handleFileChange(fakeEvent);
        } catch (error) {
            console.error('Error handling dropped file:', error);
            // You can add error handling UI feedback here if needed
        } finally {
            setIsLoading(false);
        }
    };

    const addTextAnnotation = () => {
        if (!pdfBytes || canvasDimensions.width === 0) return;
        // Default settings for new text annotation
        const newAnnotation: Annotation = {
            id: crypto.randomUUID(),
            text: 'Double-click to edit',
            x: canvasDimensions.width / 2,
            y: canvasDimensions.height / 2,
            color: '#000000',
            fontSize: 16,
            editing: true,
            page: currentPage,
            type: 'text'
        };
        setAnnotations([...annotations, newAnnotation]);
    };

    const addSignatureAnnotation = () => {
        if (!pdfBytes || canvasDimensions.width === 0) return;
        // Default settings for new signature annotation
        const newAnnotation: Annotation = {
            id: crypto.randomUUID(),
            text: '', // Signature doesn't need text
            x: canvasDimensions.width / 2,
            y: canvasDimensions.height / 2,
            color: '#000000',
            fontSize: 16,
            editing: true,
            page: currentPage,
            type: 'signature'
        };
        setAnnotations([...annotations, newAnnotation]);
    };

    const updateAnnotation = (updated: Annotation) => {
        setAnnotations(annotations.map(ann => (ann.id === updated.id ? updated : ann)));
    };

    const deleteAnnotation = (id: string) => {
        setAnnotations(annotations.filter(ann => ann.id !== id));
    };

    // Improved download function with accurate coordinate conversion
    const downloadPdf = async () => {
        if (!pdfBytes) return;

        try {
            setIsLoading(true);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();

            // Group annotations by page
            const annotationsByPage = annotations.reduce((acc, ann) => {
                const pageNum = ann.page - 1;
                if (!acc[pageNum]) acc[pageNum] = [];
                acc[pageNum].push(ann);
                return acc;
            }, {} as Record<number, Annotation[]>);

            // Process each page with annotations using a for...of loop for async/await
            for (const [pageNumStr, pageAnnotations] of Object.entries(annotationsByPage)) {
                const pageNum = parseInt(pageNumStr);
                if (pageNum >= pages.length) continue;

                const page = pages[pageNum];
                const { width: pageWidth, height: pageHeight } = page.getSize();

                // Calculate scaling factors between canvas and PDF page dimensions
                const factorX = pageWidth / canvasDimensions.width;
                const factorY = pageHeight / canvasDimensions.height;

                // For each annotation on this page, convert canvas coordinates to PDF coordinates
                for (const ann of pageAnnotations) {
                    try {
                        // Handle text annotations
                        if (ann.type === 'text') {
                            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

                            // Convert canvas (screen) coordinates to PDF coordinates:
                            // PDF x coordinate is a simple scale. PDF y coordinate must be flipped.
                            const pdfX = ann.x * factorX;
                            // Adjust y coordinate so that the text appears at the same vertical offset.
                            const pdfY = pageHeight - (ann.y * factorY) - (ann.fontSize * factorY * 0.8);

                            // Scale font size based on x factor (or choose an average factor)
                            const pdfFontSize = ann.fontSize * factorX;

                            page.drawText(ann.text, {
                                x: pdfX,
                                y: pdfY,
                                size: pdfFontSize,
                                font: helveticaFont,
                                color: rgb(...hexToRgb(ann.color))
                            });
                        }
                        // Handle signature annotations
                        else if (ann.type === 'signature' && ann.signatureData) {
                            // Extract the base64 image data without the header
                            const base64Data = ann.signatureData.split(',')[1];
                            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                            const pngImage = await pdfDoc.embedPng(imageBytes);
                            const { width: imgWidth, height: imgHeight } = pngImage.scale(1);

                            // Determine a reasonable scale for the signature (you can adjust as needed)
                            const sigScale = 0.5;

                            // Calculate position
                            const pdfX = ann.x * factorX;
                            const pdfY = pageHeight - (ann.y * factorY) - (imgHeight * sigScale);

                            // Draw the signature on the PDF
                            page.drawImage(pngImage, {
                                x: pdfX,
                                y: pdfY,
                                width: imgWidth * sigScale,
                                height: imgHeight * sigScale,
                            });
                        }
                    } catch (err) {
                        console.error('Error adding annotation to page:', err);
                    }
                }
            }

            const modifiedPdfBytes = await pdfDoc.save();
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setEditedPdfUrl(url);
            setIsLoading(false);
        } catch (error) {
            console.error('Error generating PDF:', error);
            setIsLoading(false);
        }
    };

    // Callback from PDFJSWrapper when PDF is loaded or re-rendered
    const onPdfLoad = (doc: any, dimensions: { width: number; height: number }, pages: number) => {
        setCanvasDimensions(dimensions);
        setTotalPages(pages);
    };

    const onPageChange = (pageNum: number) => {
        setCurrentPage(pageNum);
    };

    return (
        <div className="max-w-full mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold text-center mb-4">PDF Text & Signature Annotator</h1>

            <Card className="p-4">
                <div
                    className={cn(
                        "flex flex-col gap-4 p-6 border-2 border-dashed rounded-lg transition-colors",
                        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="text-center">
                        <Label htmlFor="pdf-upload" className="text-lg font-medium block mb-2">
                            Upload PDF or Drag & Drop
                        </Label>
                        <p className="text-sm text-gray-500 mb-4">
                            Upload a PDF file to start adding text or signature annotations.
                        </p>
                    </div>
                    <Input
                        id="pdf-upload"
                        type="file"
                        accept="application/pdf"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
            </Card>

            {pdfBytes && (
                <>
                    <Card className="p-4">
                        <div className="flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={addTextAnnotation} disabled={!pdfBytes}>
                                    Add Text
                                </Button>
                                <Button
                                    onClick={addSignatureAnnotation}
                                    disabled={!pdfBytes}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Add Signature
                                </Button>
                                <Button onClick={undo} disabled={historyIndex <= 0 || !pdfBytes} variant="outline">
                                    Undo
                                </Button>
                                <Button
                                    onClick={clearAnnotations}
                                    disabled={!annotations.length || !pdfBytes}
                                    variant="outline"
                                >
                                    Clear All
                                </Button>
                                <Button
                                    onClick={downloadPdf}
                                    disabled={!pdfBytes || !annotations.length}
                                    variant="default"
                                >
                                    Save PDF
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => handleZoom(-0.1)}
                                    disabled={scale <= 0.5 || !pdfBytes}
                                    size="sm"
                                    variant="outline"
                                >
                                    Zoom Out
                                </Button>
                                <span className="min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
                                <Button
                                    onClick={() => handleZoom(0.1)}
                                    disabled={scale >= 3.0 || !pdfBytes}
                                    size="sm"
                                    variant="outline"
                                >
                                    Zoom In
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => changePage(-1)}
                                    disabled={currentPage <= 1 || !pdfBytes}
                                    size="sm"
                                    variant="outline"
                                >
                                    Previous
                                </Button>
                                <span>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    onClick={() => changePage(1)}
                                    disabled={currentPage >= totalPages || !pdfBytes}
                                    size="sm"
                                    variant="outline"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="relative border rounded-lg overflow-hidden bg-gray-100">
                        {isLoading ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="text-center space-y-2">
                                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p>Loading PDF...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <PDFJSWrapper
                                    pdfBytes={pdfBytes}
                                    scale={scale}
                                    currentPage={currentPage}
                                    onPdfLoad={onPdfLoad}
                                    onPageChange={onPageChange}
                                />
                                {annotations
                                    .filter((ann) => ann.page === currentPage)
                                    .map((ann) => (
                                        <DraggableAnnotation
                                            key={ann.id}
                                            annotation={ann}
                                            onUpdate={updateAnnotation}
                                            onDelete={deleteAnnotation}
                                            scale={scale}
                                        />
                                    ))}
                            </>
                        )}
                    </div>

                    {editedPdfUrl && (
                        <Card className="p-4 text-center">
                            <p className="mb-2">Your annotated PDF is ready!</p>
                            <a
                                href={editedPdfUrl}
                                download="annotated.pdf"
                                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Download Annotated PDF
                            </a>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default PdfEditor;

// Utility function to convert hex color to rgb array (normalized)
const hexToRgb = (hex: string): [number, number, number] => {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return [r, g, b];
};