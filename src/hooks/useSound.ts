
import { useMemo, useContext, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { SettingsContextType } from '../features/quiz/types';

export const useSound = (url: string) => {
    const { isSoundEnabled } = useContext(SettingsContext) as SettingsContextType;
    
    const audio = useMemo(() => {
        if (typeof Audio === "undefined") return null;
        const a = new Audio(url);
        a.preload = 'auto';
        return a;
    }, [url]);

    useEffect(() => {
        if (audio) {
            audio.load(); // Preload the audio file
        }
    }, [audio]);
    
    const play = () => {
        if (isSoundEnabled && audio) {
            // Clone node allows overlapping sounds (fast clicking)
            const soundClone = audio.cloneNode() as HTMLAudioElement;
            soundClone.volume = 0.5; // Default volume to 50%
            soundClone.play().catch(e => {
                // Common error: User hasn't interacted with document yet
                console.warn("Sound play failed (likely autoplay policy):", e);
            });
        }
    };
    
    return play;
};
