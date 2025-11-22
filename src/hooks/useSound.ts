
import { useMemo, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { SettingsContextType } from '../features/quiz/types';

export const useSound = (url: string) => {
    const { isSoundEnabled } = useContext(SettingsContext) as SettingsContextType;
    const audio = useMemo(() => typeof Audio !== "undefined" ? new Audio(url) : undefined, [url]);
    
    const play = () => {
        if (isSoundEnabled && audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Sound play failed:", e));
        }
    };
    
    return play;
};
