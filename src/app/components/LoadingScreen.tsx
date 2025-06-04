import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from './loadingAnimation.json';

export default function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-brand-bgLight via-brand-light to-brand-mint">
      <div className="flex flex-col items-center">
        <Lottie animationData={loadingAnimation} loop={true} style={{ height: 120, width: 120 }} />
        <div className="text-xl font-semibold text-brand-dark mt-4">{message}</div>
      </div>
    </div>
  );
} 