import { create } from "zustand";
import type { FamilyMember, MemberWithPrograms } from "@shared/schema";

interface MembersState {
  members: FamilyMember[];
  membersWithPrograms: MemberWithPrograms[];
  selectedMember: FamilyMember | null;
  searchQuery: string;
  filters: {
    role: string;
    status: string;
  };
  setMembers: (members: FamilyMember[]) => void;
  setMembersWithPrograms: (membersWithPrograms: MemberWithPrograms[]) => void;
  setSelectedMember: (member: FamilyMember | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<MembersState['filters']>) => void;
}

export const useMembersStore = create<MembersState>((set) => ({
  members: [],
  membersWithPrograms: [],
  selectedMember: null,
  searchQuery: "",
  filters: {
    role: "all",
    status: "all",
  },
  setMembers: (members) => set({ members }),
  setMembersWithPrograms: (membersWithPrograms) => set({ membersWithPrograms }),
  setSelectedMember: (selectedMember) => set({ selectedMember }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
}));
