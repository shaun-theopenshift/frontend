{/*import React from 'react';
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
  */}

  export default function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f8fa] px-4">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-10 h-10 border-4 border-[#2954bd] border-t-transparent rounded-full animate-spin" />
          <div className="text-lg font-medium text-brand-dark text-center">{message}</div>
        </div>
      </div>
    );
  }