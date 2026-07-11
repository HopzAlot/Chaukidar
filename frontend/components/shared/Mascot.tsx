'use client';

import { useEffect, useRef, useState } from 'react';

type Mode = 'hanging' | 'chasing' | 'returning';

// --- Tunable constants -----------------------------------------------
// The character is drawn in a 136×235 viewBox and rendered at DISPLAY_W ×
// DISPLAY_H on screen. These offsets say "where, in screen pixels, is the
// body-center relative to the wrapper's top-left corner so he can follow the
// cursor without placing his face directly under it.
const DISPLAY_W = 80;
const DISPLAY_H = 138;
const BODY_OFFSET = { x: 40, y: 96 }; // body/face center, from wrapper top-left

const EYE_MOVE_RANGE = 6; // svg user units the pupils can drift
const HOVER_DELAY_MS = 180;
const DOCK_CHECK_MS = 700;

function getSafeDockPosition() {
  const margin = 14;
  const top = 76;
  const bottom = Math.max(top, window.innerHeight - DISPLAY_H - margin);
  const right = Math.max(margin, window.innerWidth - DISPLAY_W - margin);
  const brandMark = document.getElementById('app-brand-mark')?.getBoundingClientRect();
  const brandDock = brandMark
    ? {
        x: Math.max(margin, Math.round(brandMark.left - 18)),
        y: Math.min(bottom, Math.max(top - 4, Math.round(brandMark.bottom + 8))),
        side: 'left' as const,
        preferred: true,
      }
    : null;
  const candidates = [
    ...(brandDock ? [brandDock] : []),
    { x: margin, y: top, side: 'left' as const, preferred: false },
    { x: right, y: top, side: 'right' as const, preferred: false },
    { x: margin, y: bottom, side: 'left' as const, preferred: false },
    { x: right, y: bottom, side: 'right' as const, preferred: false },
  ];
  const blockers = Array.from(
    document.querySelectorAll<HTMLElement>(
      'main h1, main h2, main h3, main p, main a, main button, main input, main select, main table, main canvas'
    )
  ).map((element) => element.getBoundingClientRect()).filter((rect) => (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  ));

  function score(candidate: (typeof candidates)[number]) {
    const left = candidate.x - 8;
    const rightEdge = candidate.x + DISPLAY_W + 8;
    const topEdge = candidate.y - 8;
    const bottomEdge = candidate.y + DISPLAY_H + 8;
    return blockers.reduce((total, rect) => {
      const overlapWidth = Math.max(0, Math.min(rightEdge, rect.right) - Math.max(left, rect.left));
      const overlapHeight = Math.max(0, Math.min(bottomEdge, rect.bottom) - Math.max(topEdge, rect.top));
      return total + overlapWidth * overlapHeight;
    }, candidate.preferred ? 0 : 2800);
  }

  return candidates.reduce((best, candidate) => score(candidate) < score(best) ? candidate : best);
}

export default function Mascot() {
  const outerRef = useRef<HTMLDivElement>(null);
  const facingWrapRef = useRef<HTMLDivElement>(null);
  const hitAreaRef = useRef<HTMLButtonElement>(null);

  const posRef = useRef({ x: -200, y: -200 });
  const initializedRef = useRef(false);
  const safeDockRef = useRef({ x: 14, y: 76, side: 'left' as 'left' | 'right', preferred: false });
  const lastDockCheckRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const jumpStartRef = useRef<number | null>(null);
  const chaseStartedAtRef = useRef(0);
  const facingRef = useRef<1 | -1>(1);
  const rafRef = useRef<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mode, setMode] = useState<Mode>('hanging');
  const modeRef = useRef<Mode>('hanging');
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [saluting, setSaluting] = useState(false);
  const [blowing, setBlowing] = useState(false);
  const [bubbleOnLeft, setBubbleOnLeft] = useState(false);
  const [, setFacing] = useState<1 | -1>(1);

  // --- Mouse tracking: powers both eye-tracking and chase movement. --------
  useEffect(() => {
    function handleMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      const cx = posRef.current.x + BODY_OFFSET.x;
      const cy = posRef.current.y + BODY_OFFSET.y - 20;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.min(EYE_MOVE_RANGE, dist / 16);
      setPupil({ x: (dx / dist) * pull, y: (dy / dist) * pull });
    }
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // A click anywhere after the initial mascot click ends the chase.
  useEffect(() => {
    function stopChase() {
      if (
        modeRef.current === 'chasing' &&
        Date.now() - chaseStartedAtRef.current > 100
      ) {
        modeRef.current = 'returning';
        setMode('returning');
      }
    }
    window.addEventListener('click', stopChase);
    return () => window.removeEventListener('click', stopChase);
  }, []);

  // --- Occasional whistle blow ----------------------------------------
  useEffect(() => {
    function scheduleBlow() {
      const delay = 6000 + Math.random() * 5000;
      blowTimerRef.current = setTimeout(() => {
        if (modeRef.current !== 'chasing') {
          setBlowing(true);
          setTimeout(() => setBlowing(false), 550);
        }
        scheduleBlow();
      }, delay);
    }
    scheduleBlow();
    return () => {
      if (blowTimerRef.current) clearTimeout(blowTimerRef.current);
    };
  }, []);

  // --- Main animation loop: owns position for every mode ----------------
  useEffect(() => {
    function lerp(cur: { x: number; y: number }, target: { x: number; y: number }, f: number) {
      cur.x += (target.x - cur.x) * f;
      cur.y += (target.y - cur.y) * f;
    }

    function frame() {
      const now = Date.now();
      if (now - lastDockCheckRef.current >= DOCK_CHECK_MS) {
        const nextDock = getSafeDockPosition();
        safeDockRef.current = nextDock;
        lastDockCheckRef.current = now;
        setBubbleOnLeft(nextDock.side === 'right');
      }
      const dock = safeDockRef.current;
      const m = modeRef.current;

      if (m === 'hanging') {
        const target = { x: dock.x, y: dock.y };
        if (!initializedRef.current) {
          posRef.current = { ...target };
          initializedRef.current = true;
        }
        lerp(posRef.current, target, 0.18);
        const dockFacing = dock.side === 'right' ? -1 : 1;
        if (facingRef.current !== dockFacing) {
          facingRef.current = dockFacing;
          setFacing(dockFacing);
        }
      } else if (m === 'chasing') {
        let target = {
          x: mouseRef.current.x - BODY_OFFSET.x,
          y: mouseRef.current.y - BODY_OFFSET.y - 30,
        };
        // brief hop when the chase begins
        if (jumpStartRef.current !== null) {
          const t = now - jumpStartRef.current;
          if (t < 260) {
            target = { ...target, y: target.y - Math.sin((t / 260) * Math.PI) * 46 };
          } else {
            jumpStartRef.current = null;
          }
        }
        lerp(posRef.current, target, 0.1);

        const dx = target.x - posRef.current.x;
        if (Math.abs(dx) > 3) {
          const nextFacing = dx < 0 ? -1 : 1;
          if (nextFacing !== facingRef.current) {
            facingRef.current = nextFacing;
            setFacing(nextFacing);
          }
        }
      } else if (m === 'returning') {
        const target = { x: dock.x, y: dock.y };
        lerp(posRef.current, target, 0.09);
        const dist = Math.hypot(posRef.current.x - target.x, posRef.current.y - target.y);
        const dx = target.x - posRef.current.x;
        if (Math.abs(dx) > 3) {
          const nextFacing = dx < 0 ? -1 : 1;
          if (nextFacing !== facingRef.current) {
            facingRef.current = nextFacing;
            setFacing(nextFacing);
          }
        }
        if (dist < 8) {
          modeRef.current = 'hanging';
          setMode('hanging');
        }
      }

      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
      if (facingWrapRef.current) {
        facingWrapRef.current.style.transform = `scaleX(${facingRef.current})`;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleMouseEnter() {
    if (mode !== 'hanging') return;
    hoverTimerRef.current = setTimeout(() => {
      setBubbleVisible(true);
      setSaluting(true);
    }, HOVER_DELAY_MS);
  }
  function handleMouseLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setBubbleVisible(false);
    setSaluting(false);
  }
  function handleClick() {
    if (mode !== 'hanging') return;
    setBubbleVisible(false);
    setSaluting(false);
    jumpStartRef.current = Date.now();
    chaseStartedAtRef.current = Date.now();
    modeRef.current = 'chasing';
    setMode('chasing');
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const angry = mode === 'chasing';
  const whistleActive = blowing || angry;
  const interactive = mode === 'hanging';

  return (
    <div
      ref={outerRef}
      className="fixed left-0 top-0 z-[9999]"
      style={{ pointerEvents: 'none', willChange: 'transform' }}
    >
      {/* speech bubble — sibling of the swaying body so it stays upright */}
      <div className={`speech-bubble ${bubbleOnLeft ? 'speech-bubble-left' : ''} ${bubbleVisible ? 'speech-bubble-visible' : ''}`}>
        Salam sahab! Allahrakha on duty
      </div>

      <div className={mode === 'hanging' ? 'mascot-sway' : ''} style={{ transformOrigin: '50% 50%' }}>
        <div ref={facingWrapRef} style={{ transformOrigin: '50% 50%' }}>
          <button
            ref={hitAreaRef}
            type="button"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            aria-label="Poke the Chaukidar mascot"
            className="block cursor-pointer select-none bg-transparent p-0 leading-none outline-offset-4"
            style={{ pointerEvents: interactive ? 'auto' : 'none', width: DISPLAY_W, height: DISPLAY_H }}
          >
            <svg
              viewBox="0 0 136 235"
              width={DISPLAY_W}
              height={DISPLAY_H}
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="mascotBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#8E9CEC" />
                  <stop offset="1" stopColor="#5C6DCB" />
                </linearGradient>
                <linearGradient id="whistleMetal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F7F9FC" />
                  <stop offset="0.45" stopColor="#B7C0CC" />
                  <stop offset="0.72" stopColor="#FFFFFF" />
                  <stop offset="1" stopColor="#7E8794" />
                </linearGradient>
              </defs>

              {/* Baton ends at the fist; during a chase it is raised overhead. */}
              {angry ? (
                <g className="mascot-raised-stick">
                  <path d="M38 130 L73 37" fill="none" stroke="#27282C" strokeWidth="10" strokeLinecap="round" />
                  <path d="M38 130 L73 37" fill="none" stroke="#5F6269" strokeWidth="3" strokeLinecap="round" />
                  <path d="M34 130 L42 133" stroke="#16171A" strokeWidth="2" />
                  <path d="M37 123 L45 126" stroke="#16171A" strokeWidth="2" />
                </g>
              ) : (
                <g>
                  <path d="M34 148 L25 52" fill="none" stroke="#27282C" strokeWidth="10" strokeLinecap="round" />
                  <path d="M34 148 L25 52" fill="none" stroke="#5F6269" strokeWidth="3" strokeLinecap="round" />
                  <path d="M31 142 L38 141" stroke="#16171A" strokeWidth="2" />
                  <path d="M30 135 L37 134" stroke="#16171A" strokeWidth="2" />
                </g>
              )}

              {/* floating shoes — detached, bobbing independently below the body */}
              <g className="mascot-shoe" style={{ animationDelay: '0s' }}>
                <ellipse cx="52" cy="204" rx="14" ry="8" fill="#3A2317" stroke="#211208" strokeWidth="2" />
                <ellipse cx="61" cy="202" rx="6" ry="5" fill="#3A2317" stroke="#211208" strokeWidth="2" />
                <path d="M40 207 L64 207" stroke="#5A3A22" strokeWidth="1.5" strokeLinecap="round" />
              </g>
              <g className="mascot-shoe" style={{ animationDelay: '0.7s' }}>
                <ellipse cx="86" cy="207" rx="14" ry="8" fill="#3A2317" stroke="#211208" strokeWidth="2" />
                <ellipse cx="95" cy="205" rx="6" ry="5" fill="#3A2317" stroke="#211208" strokeWidth="2" />
                <path d="M74 210 L98 210" stroke="#5A3A22" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* shadow */}
              <ellipse cx="68" cy="179" rx="26" ry="5.5" fill="#14151B" opacity="0.1" />

              {/* fluff tufts, behind the main body so they peek out at the edges */}
              <g fill="#7482D6">
                <circle cx="33" cy="118" r="11" />
                <circle cx="29" cy="141" r="9" />
                <circle cx="41" cy="163" r="10" />
                <circle cx="95" cy="163" r="10" />
                <circle cx="107" cy="141" r="9" />
                <circle cx="103" cy="118" r="11" />
              </g>

              {/* body */}
              <path
                d="M68 88 C90 88 106 106 106 132 C106 160 90 178 68 178 C46 178 30 160 30 132 C30 106 46 88 68 88 Z"
                fill="url(#mascotBody)"
                stroke="#3B4696"
                strokeWidth="2.5"
              />

              {/* right arm: whistle at mouth while chasing, salute on hover. */}
              {angry ? (
                <g className="mascot-whistle-arm">
                  <path d="M99 148 Q91 151 83 145 Q78 141 76 137" fill="none" stroke="#3B4696" strokeWidth="17" strokeLinecap="round" />
                  <path d="M99 148 Q91 151 83 145 Q78 141 76 137" fill="none" stroke="#7482D6" strokeWidth="12" strokeLinecap="round" />
                  <ellipse cx="76" cy="137" rx="8" ry="6" fill="#7482D6" stroke="#3B4696" strokeWidth="2.5" transform="rotate(24 76 137)" />
                </g>
              ) : saluting ? (
                <g className="mascot-salute">
                  <path d="M99 148 Q112 137 108 123 Q105 113 98 106" fill="none" stroke="#3B4696" strokeWidth="17" strokeLinecap="round" />
                  <path d="M99 148 Q112 137 108 123 Q105 113 98 106" fill="none" stroke="#7482D6" strokeWidth="12" strokeLinecap="round" />
                  <ellipse cx="94" cy="104" rx="9" ry="6" fill="#7482D6" stroke="#3B4696" strokeWidth="2.5" transform="rotate(-18 94 104)" />
                  <path d="M88 101 L102 106" stroke="#AAB4F2" strokeWidth="1.6" strokeLinecap="round" />
                </g>
              ) : (
                <ellipse
                  cx="103"
                  cy="146"
                  rx="13"
                  ry="7.5"
                  fill="#7482D6"
                  stroke="#3B4696"
                  strokeWidth="2.5"
                  transform="rotate(24 103 146)"
                  className={mode === 'hanging' ? 'mascot-wave' : ''}
                  style={{ transformOrigin: '103px 146px' }}
                />
              )}

              {/* left arm and wrapped fist genuinely grip the baton handle. */}
              {angry ? (
                <g className="mascot-stick-arm">
                  <path d="M38 151 Q28 143 37 130" fill="none" stroke="#3B4696" strokeWidth="17" strokeLinecap="round" />
                  <path d="M38 151 Q28 143 37 130" fill="none" stroke="#7482D6" strokeWidth="12" strokeLinecap="round" />
                  <ellipse cx="39" cy="130" rx="10" ry="8" fill="#7482D6" stroke="#3B4696" strokeWidth="2.5" transform="rotate(-18 39 130)" />
                  <g stroke="#AAB4F2" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M32 126 L44 130" />
                    <path d="M32 130 L43 134" />
                    <path d="M34 134 L41 136" />
                  </g>
                  <path d="M44 124 Q49 128 45 134" fill="none" stroke="#3B4696" strokeWidth="2" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  <path d="M43 151 Q38 148 34 145" fill="none" stroke="#3B4696" strokeWidth="15" strokeLinecap="round" />
                  <path d="M43 151 Q38 148 34 145" fill="none" stroke="#7482D6" strokeWidth="10" strokeLinecap="round" />
                  <ellipse cx="34" cy="145" rx="10" ry="8" fill="#7482D6" stroke="#3B4696" strokeWidth="2.5" transform="rotate(-6 34 145)" />
                  <g stroke="#AAB4F2" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M27 141 L40 141" />
                    <path d="M26 145 L40 145" />
                    <path d="M28 149 L39 149" />
                  </g>
                  <path d="M40 138 Q45 143 41 149" fill="none" stroke="#3B4696" strokeWidth="2" strokeLinecap="round" />
                </g>
              )}

              {/* Metal referee-style whistle on a neck cord. */}
              <path
                d={angry ? 'M72 103 C84 112 82 126 78 138' : 'M72 103 C92 108 104 124 105 141'}
                fill="none"
                stroke="#283164"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <g className={angry ? 'mascot-whistle mascot-whistle-chasing' : blowing ? 'mascot-whistle mascot-whistle-blowing' : 'mascot-whistle'}>
                <path d="M91 138 L105 136 L109 143 L95 148 Z" fill="url(#whistleMetal)" stroke="#555E6B" strokeWidth="1.8" strokeLinejoin="round" />
                <rect x="92" y="139" width="4" height="8" rx="1" fill="#20242B" transform="rotate(-12 94 143)" />
                <circle cx="110" cy="143" r="7" fill="url(#whistleMetal)" stroke="#555E6B" strokeWidth="1.8" />
                <circle cx="110" cy="143" r="3.5" fill="#D8DEE7" stroke="#7E8794" strokeWidth="1" />
                <path d="M104 136 Q111 132 117 137" fill="none" stroke="#F7F9FC" strokeWidth="2" strokeLinecap="round" />
                <circle cx="116" cy="134" r="2.5" fill="none" stroke="#727C89" strokeWidth="1.5" />
              </g>
              {whistleActive && (
                <g transform={angry ? 'translate(-28 3)' : undefined}>
                  <g className="whistle-note">
                    <path d="M118 137 Q126 134 128 127" fill="none" stroke="#E23F8E" strokeWidth="2" strokeLinecap="round" />
                    <path d="M120 144 Q130 142 132 135" fill="none" stroke="#EC5FA3" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </g>
              )}

              {/* cheeks */}
              <circle cx="43" cy="141" r="6" fill="#F2A6B0" opacity="0.55" />
              <circle cx="93" cy="141" r="6" fill="#F2A6B0" opacity="0.55" />

              {/* eyebrows — only while chasing (angry) */}
              {angry && (
                <g stroke="#20264D" strokeWidth="3.2" strokeLinecap="round">
                  <path d="M42 118 L60 124" />
                  <path d="M76 124 L94 118" />
                </g>
              )}

              {/* eyes: tracking pupils */}
              <ellipse cx="52" cy="132" rx="13" ry="14" fill="#FFFFFF" stroke="#3B4696" strokeWidth="2" />
              <ellipse cx="84" cy="132" rx="13" ry="14" fill="#FFFFFF" stroke="#3B4696" strokeWidth="2" />
              <g style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)`, transition: 'transform 70ms linear' }}>
                <circle cx="52" cy="134" r="6" fill="#14151B" />
                <circle cx="84" cy="134" r="6" fill="#14151B" />
                <circle cx="54.2" cy="131.2" r="1.8" fill="#FFFFFF" />
                <circle cx="86.2" cy="131.2" r="1.8" fill="#FFFFFF" />
              </g>

              {/* mouth: smile normally, firm frown while chasing */}
              {angry ? (
                <path d="M54 154 Q68 146 82 154" stroke="#20264D" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              ) : (
                <path d="M56 150 Q68 157 80 150" stroke="#20264D" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              )}

              {/* guard cap */}
              <path
                d="M42 94 C42 68 94 68 94 94 L94 102 L42 102 Z"
                fill="#E4D2A6"
                stroke="#3B4696"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <ellipse cx="68" cy="102" rx="36" ry="8" fill="#C9AE79" stroke="#3B4696" strokeWidth="2.5" />
              <circle cx="68" cy="82" r="7.5" fill="#232A5C" stroke="#FFFFFF" strokeWidth="1.6" />
              <circle cx="68" cy="82" r="2.3" fill="#FFFFFF" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
