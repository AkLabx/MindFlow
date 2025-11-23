
import React, { useEffect, useState } from 'react';

export const AnimatedCounter = ({ value, duration = 1500 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMilSec = duration;
    const incrementTime = (totalMilSec / end) * 1; // Adjust for large numbers

    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, Math.max(incrementTime, 10)); // Cap speed at 10ms

    // Fallback for very large numbers to ensure it finishes
    const cleanup = setTimeout(() => {
        setCount(end);
        clearInterval(timer);
    }, duration);

    return () => {
        clearInterval(timer);
        clearTimeout(cleanup);
    };
  }, [value, duration]);

  return <span>{count}</span>;
};
