import { makeAutoObservable, runInAction } from "mobx";

type User = {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    role?: string;
    phone: string;
    studentId: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
};

class UserStore {
    user: User | null = null;
    isHydrated = false; // Ensure hydration state tracking
    notifCount = 0;

    constructor() {
        makeAutoObservable(this);
        this.hydrateUser(); // Load user data safely
        this.hydrateNotifCount(); // Load notification count
    }

    setUser(userData: User) {
        runInAction(() => {
            this.user = userData;
        });
        if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(userData));
        }
    }

    setNotifCount(count: number) {
        runInAction(() => {
            this.notifCount = count;
        });
        if (typeof window !== "undefined") {
            localStorage.setItem("notifCount", JSON.stringify(count));
        }
    }

    clearUser() {
        runInAction(() => {
            this.user = null;
        });
        if (typeof window !== "undefined") {
            localStorage.removeItem("user");
        }
    }

    private hydrateUser() {
        if (typeof window === "undefined") return; // Prevent access during SSR

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                runInAction(() => {
                    this.user = JSON.parse(storedUser);
                });
            } catch (error) {
                console.error("Failed to parse user data:", error);
                localStorage.removeItem("user"); // Remove corrupted data
            }
        }

        runInAction(() => {
            this.isHydrated = true; // Mark hydration complete
        });
    }

    private hydrateNotifCount() {
        if (typeof window === "undefined") return;

        const storedNotifCount = localStorage.getItem("notifCount");
        if (storedNotifCount) {
            try {
                runInAction(() => {
                    this.notifCount = JSON.parse(storedNotifCount);
                });
            } catch (error) {
                console.error("Failed to parse notif count:", error);
                localStorage.removeItem("notifCount");
            }
        }
    }

    get isAuthenticated() {
        return this.isHydrated && this.user !== null;
    }
}

export const userStore = new UserStore();
