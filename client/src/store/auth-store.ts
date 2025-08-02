/**
 * @purpose Global authentication state management using Zustand
 * @connects-to shared/schema.ts (User type)
 * @connects-to client/src/pages/dashboard.tsx
 * @connects-to client/src/components/navigation.tsx
 */
import { create } from "zustand";
import type { User } from "@/types/schema";
import { getCurrentUser } from "@/services/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
  initialize: async () => {
    try {
      const currentUser = await getCurrentUser();
      set({ user: currentUser });
    } finally {
      set({ isLoading: false });
    }
  },
}));
