import React from "react";
import { cn } from "@/lib/utils"; // Ensure this import is correct
import { Menu, Home, Users, Bed, DoorOpen, LogOut, Building } from "lucide-react";

const MenuItems = ({ user, isOpen }: any) => {
    const items = [
        { name: "Home", icon: Home, href: "/" },
        ...(user.role !== "admin" ? [{ name: "Dorms & Rooms", icon: Building, href: "/tupv-dorms" }] : []),
        ...(user.role !== "student" ? [
            { name: "Students", icon: Users, href: "/students" },
            { name: "Dormitories", icon: Building, href: "/dorms" },
        ] : []),
        ...(user.role === "student" ? [{ name: "Applications", icon: Bed, href: "/applications" }] : []),
    ];

    return (
        <>
            {items.map(({ name, icon: Icon, href }) => (
                <a
                    key={name}
                    href={href}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
                        "hover:bg-gray-50",
                        (href === '/' || href === '/students' || href === '/dorms') && "bg-gray-50 font-medium", // Active state for home, students, and dorms
                        !isOpen && "justify-center"
                    )}
                >
                    <Icon className={cn(
                        "h-5 w-5",
                        (href === '/' || href === '/students' || href === '/dorms') ? "text-maroon-600" : "text-gray-500",
                    )} style={(href === '/' || href === '/students' || href === '/dorms') ? { color: "#8B2131" } : {}} />
                    {isOpen && <span className={cn(
                        "text-sm",
                        (href === '/' || href === '/students' || href === '/dorms') ? "text-maroon-600 font-medium" : "text-gray-700",
                    )} style={(href === '/' || href === '/students' || href === '/dorms') ? { color: "#8B2131" } : {}}>
                        {name}
                    </span>}
                </a>
            ))}
        </>
    );
};

export default MenuItems;