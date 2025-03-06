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


const DraggableAnnotation = ({ annotation, onUpdate, onDelete, scale }: DraggableAnnotationProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

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

    return (
        <div
            className={cn(
                "absolute transition-opacity group",
                isDragging ? "cursor-grabbing opacity-80" : "cursor-grab opacity-100",
                annotation.editing ? "z-50" : "z-10"
            )}
            style={{ top: annotation.y, left: annotation.x }}
        >
            {annotation.editing ? (
                <Card className="p-4 shadow-lg w-72 border-2 bg-gray-200">
                    <CardContent className="space-y-4 p-0">
                        <Input
                            type="text"
                            value={annotation.text}
                            onChange={(e) => onUpdate({ ...annotation, text: e.target.value })}
                            className="w-full"
                            autoFocus
                        />
                        <div className="flex items-center gap-3 flex-wrap ">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="fontSize" className="text-xs font-medium">
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
                                        className="w-8 h-8 p-0"
                                        style={{ backgroundColor: annotation.color }}
                                    >
                                        <span className="sr-only">Pick a color</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3">
                                    <HexColorPicker
                                        color={annotation.color}
                                        onChange={(color) => onUpdate({ ...annotation, color })}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex justify-between gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => onUpdate({ ...annotation, editing: false })}
                            >
                                Done
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => onDelete(annotation.id)}
                            >
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div
                    className="relative group"
                    onMouseDown={handleMouseDown}
                    onDoubleClick={() => onUpdate({ ...annotation, editing: true })}
                >
                    <span className="select-none whitespace-pre-wrap" style={textStyles}>
                        {annotation.text}
                    </span>
                </div>
            )}
        </div>
    );
};


export default DraggableAnnotation