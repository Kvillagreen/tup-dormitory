"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X } from 'lucide-react';

const SignatureDrawing = ({ onSave }: any) => {
    const canvasRef = useRef<any>(null);
    const [isDrawing, setIsDrawing] = useState<any>(false);
    const [ctx, setCtx] = useState<any>(null);
    const [open, setOpen] = useState<any>(false);
    const [signature, setSignature] = useState<any>(null);

    useEffect(() => {
        if (open && canvasRef.current) {
            const canvas: any = canvasRef.current;
            const context: any = canvas.getContext('2d');

            context.fillStyle = 'rgba(0,0,0,0)';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.strokeStyle = '#000000';
            context.lineWidth = 2;
            context.lineCap = 'round';
            context.lineJoin = 'round';

            setCtx(context);
            clearCanvas();
        }
    }, [open]);

    const startDrawing = (e: any) => {
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing || !ctx) return;

        const { offsetX, offsetY } = getCoordinates(e);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = (): any => {
        if (!ctx) return;

        if (isDrawing) {
            ctx.closePath();
            setIsDrawing(false);
        }
    };

    const getCoordinates = (e: any): any => {
        if (e.touches && e.touches[0]) {
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const clearCanvas = (): any => {
        if (!ctx || !canvasRef.current) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const saveSignature = (): any => {
        if (!canvasRef.current) return;

        const signatureUrl = canvasRef.current.toDataURL('image/png');
        setSignature(signatureUrl);

        if (onSave) {
            onSave(signatureUrl);
        }

        setOpen(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Add Signature</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Draw Signature</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="border rounded-md relative">
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={200}
                                className="w-full h-auto bg-white"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={clearCanvas}>
                                Clear
                            </Button>
                            <Button onClick={saveSignature}>
                                Save Signature
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {signature && (
                <Card className="mt-4">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm">Your Signature</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSignature(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-100 rounded-md p-4 flex justify-center">
                            <img
                                src={signature}
                                alt="Your signature"
                                className="max-h-24"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
};

export default SignatureDrawing;