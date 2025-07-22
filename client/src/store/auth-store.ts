/**
 * @purpose Global authentication state management using Zustand
 * @connects-to shared/schema.ts (User type)
 * @connects-to client/src/pages/dashboard.tsx
 * @connects-to client/src/components/navigation.tsx
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@shared/schema";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
