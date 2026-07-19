import { create } from "zustand";

type AsideState = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
};

/**
 * One store per aside, so panels open and close independently. Kept as a
 * factory rather than a single keyed store: each aside gets its own
 * subscription, and toggling one does not re-render the others.
 */
const createAsideStore = (defaultIsOpen: boolean) =>
  create<AsideState>((set) => ({
    isOpen: defaultIsOpen,
    setIsOpen: (isOpen) => set({ isOpen }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  }));

export const useJobsAside = createAsideStore(true);
