'use client';

import dynamic from 'next/dynamic';

const GradientBackground = dynamic(() => import('./GradientBackground'), {
  ssr: false,
});

export default function GradientBackgroundLoader() {
  return <GradientBackground />;
}
