import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { evictionSchema } from "./navigation/students";
import { EvictionFormData } from "./navigation/students";

interface EvictionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: EvictionFormData) => void;
    student?: any | null;
}

export function EvictionDialog({ isOpen, onClose, onConfirm, student }: EvictionDialogProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EvictionFormData>({
        resolver: zodResolver(evictionSchema),
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl shadow-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-600 h-6 w-6" />
                        <DialogTitle className="text-xl font-bold text-gray-800">Confirm Eviction</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-600 mt-2">
                        Are you sure you want to evict{" "}
                        <span className="font-semibold text-gray-900">
                            {student?.firstName} {student?.lastName}
                        </span>{" "}
                        from their room? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {/* Eviction Form */}
                <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
                    {/* Reason for Eviction */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reason for Eviction</label>
                        <Input
                            type="text"
                            placeholder="Enter reason..."
                            {...register("evictionReason")}
                            className="mt-1 w-full border-gray-300 focus:ring-red-500 focus:border-red-500"
                        />
                        {errors.evictionReason && (
                            <p className="text-red-500 text-xs mt-1">{errors.evictionReason.message}</p>
                        )}
                    </div>

                    {/* Eviction Notice Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Eviction Notice Date</label>
                        <Input
                            type="date"
                            {...register("evictionNoticeDate")}
                            className="mt-1 w-full border-gray-300 focus:ring-red-500 focus:border-red-500"
                        />
                        {errors.evictionNoticeDate && (
                            <p className="text-red-500 text-xs mt-1">{errors.evictionNoticeDate.message}</p>
                        )}
                    </div>

                    {/* Eviction Notice Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Eviction Notice Time</label>
                        <Input
                            type="time"
                            {...register("evictionNoticeTime")}
                            className="mt-1 w-full border-gray-300 focus:ring-red-500 focus:border-red-500"
                        />
                        {errors.evictionNoticeTime && (
                            <p className="text-red-500 text-xs mt-1">{errors.evictionNoticeTime.message}</p>
                        )}
                    </div>

                    {/* Dialog Footer */}
                    <DialogFooter className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-red-600 text-white hover:bg-red-700">
                            Confirm Eviction
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
