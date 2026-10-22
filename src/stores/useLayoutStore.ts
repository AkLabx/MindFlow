import { create } from 'zustand';

export interface LayoutState {
  hideGlobalFooter: boolean;
  setHideGlobalFooter: (val: boolean) => void;
  hideGlobalHeader: boolean;
  setHideGlobalHeader: (val: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  hideGlobalFooter: false,
  setHideGlobalFooter: (val) => set({ hideGlobalFooter: val }),
  hideGlobalHeader: false,
  setHideGlobalHeader: (val) => set({ hideGlobalHeader: val }),
}));
