import React, { useEffect, useState, useRef } from 'react';
import './BlueIntro.css';
import { IntroProps } from '../../registry/types';

const BlueIntro: React.FC<IntroProps> = ({ config, onComplete }) => {
  const [phase, setPhase] = useState<'initial' | 'pre-zoom' | 'expanding' | 'vanishing' | 'done'>('initial');

  // Stable ref for onComplete to avoid triggering useEffects on re-renders
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // We intentionally removed hasRunRef to allow React 18 strict mode
    // to teardown and restart cleanly.

    // Use config duration, default to 2000 if not provided or 0
    const initialDuration = config.duration > 0 ? config.duration : 2000;

    let preZoomTimer: NodeJS.Timeout;
    let revealTimer: NodeJS.Timeout;
    let doneTimer: NodeJS.Timeout;
    let raf1: number;
    let raf2: number;

    // Phase 1: Let the logo breathe
    preZoomTimer = setTimeout(() => {
      setPhase('pre-zoom');

      // Phase 2: Grow the overlay circle from logo center
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setPhase('expanding');
        });
      });

      // Phase 3: Reveal page (clip path transition is ~1.4s)
      revealTimer = setTimeout(() => {
        setPhase('vanishing');

        // Phase 4: Clean up and tell parent we are done
        doneTimer = setTimeout(() => {
          setPhase('done');
          onCompleteRef.current();
        }, 650);
      }, 1400);
    }, initialDuration);

    // Strict Mode cleanup: ensure EVERY timer and raf is cancelled
    return () => {
      clearTimeout(preZoomTimer);
      clearTimeout(revealTimer);
      clearTimeout(doneTimer);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  // Intentionally omitting onComplete from deps since we use the ref pattern
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.duration]);

  if (phase === 'done') return null;

  const isFadeEarly = phase === 'pre-zoom' || phase === 'expanding' || phase === 'vanishing';
  const isExpanding = phase === 'expanding' || phase === 'vanishing';
  const isVanishing = phase === 'vanishing';

  return (
    <>
      <div
        className={`zoom-overlay ${isExpanding ? 'expanding' : ''} ${isVanishing ? 'vanishing' : ''}`}
        style={{ zIndex: 9999 }}
      />
      <div
        className={`pwa-splash-screen ${isVanishing ? 'final-vanish' : ''}`}
        style={{ zIndex: 9000 }}
      >
        <div className="mf-orbital-system">
          <div className={`mf-halo-ring ${isFadeEarly ? 'fade-early' : ''}`}></div>
          <div className="mf-core-logo">
            <svg className="mf-brain-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path className="mf-brain-path" d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
              <path className="mf-brain-path" style={{ animationDelay: '0.3s' }} d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
            </svg>
          </div>
        </div>
        <div className={`mf-brand-name ${isFadeEarly ? 'fade-early' : ''}`}>
          MindFlow
        </div>
      </div>
    </>
  );
};

export default BlueIntro;
