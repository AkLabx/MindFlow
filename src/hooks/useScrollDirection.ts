import { useState, useEffect } from 'react';

export enum ScrollDirection {
    Up = 'up',
    Down = 'down',
    None = 'none',
}

interface ScrollDirectionConfig {
    thresholdDown?: number;
    thresholdUp?: number;
}

export const useScrollDirection = ({ thresholdDown = 40, thresholdUp = 20 }: ScrollDirectionConfig = {}) => {
    const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(ScrollDirection.None);
    const [prevScrollY, setPrevScrollY] = useState(0);

    useEffect(() => {
        let lastScrollY = window.pageYOffset;
        let ticking = false;

        const updateScrollDirection = () => {
            const scrollY = window.pageYOffset;

            if (Math.abs(scrollY - lastScrollY) < (scrollY > lastScrollY ? thresholdDown : thresholdUp)) {
                ticking = false;
                return;
            }

            // Only update direction if we've scrolled past the threshold
            const direction = scrollY > lastScrollY ? ScrollDirection.Down : ScrollDirection.Up;

            if (direction !== scrollDirection && (scrollY - lastScrollY > thresholdDown || lastScrollY - scrollY > thresholdUp)) {
                setScrollDirection(direction);
            }

            lastScrollY = scrollY > 0 ? scrollY : 0;
            setPrevScrollY(lastScrollY);
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollDirection);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll);

        return () => {
            window.removeEventListener('scroll', onScroll);
        };
    }, [scrollDirection, thresholdDown, thresholdUp]);

    return scrollDirection;
};
