'use client';

import dynamic from 'next/dynamic';

// The mascot reads window/document position every frame (getBoundingClientRect
// on the navbar logo, mouse coordinates, etc.), so it can only exist in the
// browser. This tiny client wrapper is what lets the (server) root layout
// mount it with `ssr: false` without Next.js complaining.
const Mascot = dynamic(() => import('./Mascot'), { ssr: false });

export default function MascotLoader() {
  return <Mascot />;
}
