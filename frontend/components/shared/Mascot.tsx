'use client';

import { useEffect, useRef, useState } from 'react';

type Mode = 'hanging' | 'chasing' | 'returning' | 'patrolling';

// --- Tunable constants -----------------------------------------------
// The character is drawn in a 136×235 viewBox and rendered at DISPLAY_W ×
// DISPLAY_H on screen. These offsets say "where, in screen pixels, is the
// dock point / body-center relative to the wrapper's top-left corner" so we
// can place him beside the logo, or center the body on the
// cursor. They're hand-estimated (no way to render a live browser in this
// environment) — nudge them if he doesn't sit neatly beside the badge.
const DISPLAY_W = 80;
const DISPLAY_H = 138;
const DOCK_OFFSET = { x: 29, y: 12 };
const BODY_OFFSET = { x: 40, y: 96 }; // body/face center, from wrapper top-left

const EYE_MOVE_RANGE = 6; // svg user units the pupils can drift
const IDLE_MOUSE_MS = 900; // how long the cursor must sit still before the chase ends
const HOVER_DELAY_MS = 180;

function getAnchorPoint() {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('mascot-anchor');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.right - 4, y: r.top + 4 };
}

export default function Mascot() {
  const outerRef = useRef<HTMLDivElement>(null);
  const facingWrapRef = useRef<HTMLDivElement>(null);
  const hitAreaRef = useRef<HTMLButtonElement>(null);

  const posRef = useRef({ x: -200, y: -200 });
  const initializedRef = useRef(false);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const lastMoveRef = useRef(Date.now());
  const jumpStartRef = useRef<number | null>(null);
  const patrolXRef = useRef<number | null>(null);
  const patrolDirRef = useRef<1 | -1>(-1); // -1 = moving left first, per the brief
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
  const [, setFacing] = useState<1 | -1>(1);

  // --- Mouse tracking: powers both eye-tracking and the chase/idle logic --
  useEffect(() => {
    function handleMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      lastMoveRef.current = Date.now();

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

  // --- Patrol trigger from audit pages (see run/page.tsx) ------------------
  useEffect(() => {
    function start() {
      if (modeRef.current === 'chasing') return; // don't interrupt a chase
      patrolXRef.current = null;
      setBubbleVisible(false);
      setMode('patrolling');
    }
    function end() {
      if (modeRef.current === 'patrolling') setMode('returning');
    }
    window.addEventListener('chaukidar:patrol-start', start);
    window.addEventListener('chaukidar:patrol-end', end);
    return () => {
      window.removeEventListener('chaukidar:patrol-start', start);
      window.removeEventListener('chaukidar:patrol-end', end);
    };
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
      const anchor = getAnchorPoint();
      const m = modeRef.current;

      if (m === 'hanging') {
        if (anchor) {
          const target = { x: anchor.x - DOCK_OFFSET.x, y: anchor.y - DOCK_OFFSET.y };
          if (!initializedRef.current) {
            posRef.current = { ...target };
            initializedRef.current = true;
          }
          lerp(posRef.current, target, 0.18);
        }
        if (facingRef.current !== 1) {
          facingRef.current = 1;
          setFacing(1);
        }
      } else if (m === 'chasing') {
        const now = Date.now();
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

        if (now - lastMoveRef.current > IDLE_MOUSE_MS) {
          setMode('returning');
        }
      } else if (m === 'returning') {
        if (anchor) {
          const target = { x: anchor.x - DOCK_OFFSET.x, y: anchor.y - DOCK_OFFSET.y };
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
          if (dist < 8) setMode('hanging');
        }
      } else if (m === 'patrolling') {
        if (patrolXRef.current === null) {
          patrolXRef.current = window.innerWidth - 120;
          patrolDirRef.current = -1;
        }
        patrolXRef.current += patrolDirRef.current * 1.7;
        const leftBound = 40;
        const rightBound = window.innerWidth - 120;
        if (patrolXRef.current <= leftBound) {
          patrolXRef.current = leftBound;
          patrolDirRef.current = 1;
        } else if (patrolXRef.current >= rightBound) {
          patrolXRef.current = rightBound;
          patrolDirRef.current = -1;
        }
        const bob = Math.sin(Date.now() / 160) * 5;
        const target = { x: patrolXRef.current, y: 84 + bob };
        lerp(posRef.current, target, 0.25);

        if (facingRef.current !== patrolDirRef.current) {
          facingRef.current = patrolDirRef.current;
          setFacing(patrolDirRef.current);
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
    lastMoveRef.current = Date.now();
    setMode('chasing');
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const angry = mode === 'chasing';
  const interactive = mode === 'hanging';

  return (
    <div
      ref={outerRef}
      className="fixed left-0 top-0 z-[9999]"
      style={{ pointerEvents: 'none', willChange: 'transform' }}
    >
      {/* speech bubble — sibling of the swaying body so it stays upright */}
      <div className={`speech-bubble ${bubbleVisible ? 'speech-bubble-visible' : ''}`}>
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

              {/* Wooden side-handle guard stick, based on a traditional lathi. */}
              <path
                d="M27 202 L42 58"
                fill="none"
                stroke="#3F2616"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                d="M27 202 L42 58"
                fill="none"
                stroke="#9A6238"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path d="M39 79 L60 68" fill="none" stroke="#3F2616" strokeWidth="11" strokeLinecap="round" />
              <path d="M39 79 L60 68" fill="none" stroke="#9A6238" strokeWidth="4" strokeLinecap="round" />
              <ellipse cx="62" cy="67" rx="6" ry="7" fill="#704326" stroke="#3F2616" strokeWidth="2" transform="rotate(62 62 67)" />
              <g stroke="#D8A779" strokeWidth="1.5" opacity="0.85">
                <path d="M39 65 L45 66" />
                <path d="M38 70 L44 71" />
                <path d="M47 75 L51 80" />
                <path d="M52 72 L56 77" />
              </g>

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

              {/* right arm: salute on hover, relaxed wave otherwise */}
              {saluting ? (
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

              {/* left arm/fist — grips the stick shaft */}
              <ellipse cx="33" cy="146" rx="12" ry="9" fill="#7482D6" stroke="#3B4696" strokeWidth="2.5" />

              {/* Metal referee-style whistle on a neck cord. */}
              <path d="M72 103 C92 108 104 124 105 141" fill="none" stroke="#283164" strokeWidth="2" strokeLinecap="round" />
              <g className={blowing ? 'mascot-whistle mascot-whistle-blowing' : 'mascot-whistle'}>
                <path d="M91 138 L105 136 L109 143 L95 148 Z" fill="url(#whistleMetal)" stroke="#555E6B" strokeWidth="1.8" strokeLinejoin="round" />
                <rect x="92" y="139" width="4" height="8" rx="1" fill="#20242B" transform="rotate(-12 94 143)" />
                <circle cx="110" cy="143" r="7" fill="url(#whistleMetal)" stroke="#555E6B" strokeWidth="1.8" />
                <circle cx="110" cy="143" r="3.5" fill="#D8DEE7" stroke="#7E8794" strokeWidth="1" />
                <path d="M104 136 Q111 132 117 137" fill="none" stroke="#F7F9FC" strokeWidth="2" strokeLinecap="round" />
                <circle cx="116" cy="134" r="2.5" fill="none" stroke="#727C89" strokeWidth="1.5" />
              </g>
              {blowing && (
                <g className="whistle-note">
                  <path d="M118 137 Q126 134 128 127" fill="none" stroke="#E23F8E" strokeWidth="2" strokeLinecap="round" />
                  <path d="M120 144 Q130 142 132 135" fill="none" stroke="#EC5FA3" strokeWidth="2" strokeLinecap="round" />
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
