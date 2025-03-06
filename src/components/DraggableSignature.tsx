"use client";

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DraggableAnnotation from './DraggableAnnotation';

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
}

interface Signature {
    id: string;
    paths: { x: number; y: number }[][];
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    lineWidth: number;
    page: number;
}

interface DraggableAnnotationProps {
    annotation: Annotation;
    onUpdate: (ann: Annotation) => void;
    onDelete: (id: string) => void;
    scale: number;
}

interface DraggableSignatureProps {
    signature: Signature;
    onUpdate: (sig: Signature) => void;
    onDelete: (id: string) => void;
    scale: number;
}


const DraggableSignature = ({ signature, onUpdate, onDelete, scale }: DraggableSignatureProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        setIsDragging(true);
        setOffset({
            x: e.clientX - signature.x,
            y: e.clientY - signature.y
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - offset.x;
        const newY = e.clientY - offset.y;
        onUpdate({ ...signature, x: newX, y: newY });
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

    // Render the signature paths as SVG
    return (
        <div
            className={cn(
                "absolute transition-opacity group",
                isDragging ? "cursor-grabbing opacity-80" : "cursor-grab opacity-100",
                "z-10"
            )}
            style={{
                top: signature.y,
                left: signature.x,
                width: signature.width,
                height: signature.height
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={() => onDelete(signature.id)} // Double-click to delete
        >
            <svg
                width={signature.width}
                height={signature.height}
                viewBox={`0 0 ${signature.width} ${signature.height}`}
                className="signature-svg"
                style={{
                    backgroundColor: 'transparent',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
            >
                {signature.paths.map((path, index) => (
                    <path
                        key={index}
                        d={path.map((point, i) =>
                            `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                        ).join(' ')}
                        stroke={signature.color}
                        strokeWidth={signature.lineWidth}
                        fill="none"
                    />
                ))}
            </svg>
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transform translate-x-1/2 -translate-y-1/2"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(signature.id);
                }}
            >
                ×
            </div>
        </div>
    );
};
export default DraggableSignature