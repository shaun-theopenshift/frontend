
import React from 'react';
import Lottie, { LottieOptions } from 'lottie-react'; // Import LottieOptions for type safety

interface LottieAnimationProps {
  animationData: object; // The JSON animation data
  loop?: boolean;
  autoplay?: boolean;
  className?: string; // For styling the container div
  // You can add more Lottie-react props here if needed, e.g., renderer, speed, etc.
  // For example:
  // style?: React.CSSProperties;
  // lottieRef?: React.Ref<any>;
  // onComplete?: () => void;
  // etc.
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationData,
  loop = true,
  autoplay = true,
  className,
  // Pass through any other Lottie-react specific props if added to interface
}) => {
  // Basic Lottie options
  const options: LottieOptions = {
    animationData: animationData,
    loop: loop,
    autoplay: autoplay,
    // You can add more default options here
  };

  return (
    <div className={className}>
      <Lottie
        animationData={animationData} // Pass animationData directly to Lottie component
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }} // Ensure Lottie fills its container
        // Pass through any other props from 'options' if you want to use the options object
      />
    </div>
  );
};

export default LottieAnimation; // This is crucial for the dynamic import to work