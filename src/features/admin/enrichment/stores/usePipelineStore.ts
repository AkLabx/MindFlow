import { create } from 'zustand';
import { PipelineType } from '../constants/pipelineRegistry';

interface PipelineState {
    selectedPipeline: PipelineType;
    setSelectedPipeline: (pipeline: PipelineType) => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
    selectedPipeline: 'vocabulary',
    setSelectedPipeline: (pipeline) => set({ selectedPipeline: pipeline })
}));
