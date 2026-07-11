'use client';

import { useEffect, useRef, useState } from 'react';

type Mode = 'hanging' | 'chasing' | 'returning' | 'patrolling';

// --- Tunable constants -----------------------------------------------
// The character is drawn in a 136×235 viewBox and rendered at DISPLAY_W ×
// DISPLAY_H on screen. These offsets say "where, in screen pixels, is the
// cane-hook / body-center relative to the wrapper's top-left corner" so we
// can dock the hook exactly onto the logo, or center the body on the
// cursor. They're hand-estimated (no way to render a live browser in this
// environment) — nudge them if the hook doesn't sit exactly on the badge.
const DISPLAY_W = 80;
const DISPLAY_H = 138;
const HOOK_OFFSET = { x: 29, y: 12 }; // cane hook catch-point, from wrapper top-left
const BODY_OFFSET = { x: 40, y: 96 }; // body/face center, from wrapper top-left

const EYE_MOVE_RANGE = 6; // svg user units the pupils can drift
const IDLE_MOUSE_MS = 900; // how long the cursor must sit still before the chase ends
const HOVER_DELAY_MS = 1000; // how long you must hover before he greets you

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
          const target = { x: anchor.x - HOOK_OFFSET.x, y: anchor.y - HOOK_OFFSET.y };
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
          const target = { x: anchor.x - HOOK_OFFSET.x, y: anchor.y - HOOK_OFFSET.y };
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
    hoverTimerRef.current = setTimeout(() => setBubbleVisible(true), HOVER_DELAY_MS);
  }
  function handleMouseLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setBubbleVisible(false);
  }
  function handleClick() {
    if (mode !== 'hanging') return;
    setBubbleVisible(false);
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
        Salam Sahab!!
      </div>

      <div className={mode === 'hanging' ? 'mascot-sway' : ''} style={{ transformOrigin: '50% 0%' }}>
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
              </defs>

              {/* cane: hook catches the logo when hanging, shaft held in the left hand */}
              <path
                d="M33 146 L33 50 C33 26 55 18 64 32 C69 41 58 50 46 43"
                fill="none"
                stroke="#5A3420"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M33 146 L33 50 C33 26 55 18 64 32 C69 41 58 50 46 43"
                fill="none"
                stroke="#7A4C2E"
                strokeWidth="3"
                strokeLinecap="round"
              />

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

              {/* right arm — free, waves gently only while hanging */}
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

              {/* left arm/fist — grips the cane shaft */}
              <ellipse cx="33" cy="146" rx="12" ry="9" fill="#7482D6" stroke="#3B4696" strokeWidth="2.5" />

              {/* whistle, side of the face, on a short cord */}
              <path d="M96 122 Q108 128 104 138" fill="none" stroke="#3B4696" strokeWidth="2" />
              <rect x="99" y="136" width="9" height="15" rx="3.5" fill="#D7DCEE" stroke="#3B4696" strokeWidth="2" />
              <circle cx="103.5" cy="149" r="2" fill="#3B4696" />
              {blowing && (
                <g className="whistle-note">
                  <path d="M110 140 Q118 138 120 132" fill="none" stroke="#E23F8E" strokeWidth="2" strokeLinecap="round" />
                  <path d="M110 146 Q120 145 123 138" fill="none" stroke="#EC5FA3" strokeWidth="2" strokeLinecap="round" />
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
