import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentNotice({ noticeNotifications }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Notices</CardTitle>
            </CardHeader>
            <CardContent>
                {noticeNotifications.length > 0 ? (
                    <div className="space-y-4">
                        {noticeNotifications.map((notice: any) => (
                            <div key={notice._id} className="p-4 border rounded-lg shadow-sm">
                                <h2 className="text-lg font-semibold">Payment Due: ${notice.amount}</h2>
                                <p className="text-sm text-gray-500">Due Date: {new Date(notice.dueDate).toLocaleDateString()}</p>
                                <p className="text-sm">{notice.description}</p>
                                <p className="text-sm font-medium">Student: {notice.firstName} {notice.lastName}</p>
                                <p className="text-sm text-gray-600">Email: {notice.email}</p>
                                <p className="text-sm text-gray-600">Phone: {notice.phone}</p>
                                <Button className="mt-2">View Details</Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No payment notices available.</p>
                )}
            </CardContent>
        </Card>
    );
}
