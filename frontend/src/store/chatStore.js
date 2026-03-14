import { create } from 'zustand';

const useChatStore = create((set) => ({
  isOpen: false,
  activeSessionId: null,
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false, activeSessionId: null }),
  setActiveSession: (id) => set({ activeSessionId: id, isOpen: true }),
}));

export default useChatStore;
