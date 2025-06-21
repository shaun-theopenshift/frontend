import { useEffect, useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ToastProps {
    message: string;
    duration?: number;
    onClose: () => void;
    isVisible: boolean;
    type?: 'success' | 'error';
}

export default function Toast({ 
    message, 
    duration = 5000, 
    onClose, 
    isVisible, 
    type = 'error' 
}: ToastProps) {
    const [progress, setProgress] = useState(100);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (!isVisible) return;

        const startTime = Date.now();
        const endTime = startTime + duration;
        
        const updateProgress = () => {
            const now = Date.now();
            const remaining = endTime - now;
            const newProgress = (remaining / duration) * 100;
            
            if (newProgress <= 0) {
                setIsClosing(true);
                setTimeout(onClose, 300); // Wait for fade out animation
                return;
            }
            
            setProgress(newProgress);
            requestAnimationFrame(updateProgress);
        };

        const animationFrame = requestAnimationFrame(updateProgress);
        
        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [isVisible, duration, onClose]);

    if (!isVisible && !isClosing) return null;

    // Color and icon based on type
    const isSuccess = type === 'success';
    const containerClass = isSuccess
        ? 'bg-green-50 border border-green-200'
        : 'bg-red-50 border border-red-200';
    const progressClass = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const textClass = isSuccess ? 'text-green-800' : 'text-red-800';
    const closeHoverClass = isSuccess ? 'hover:bg-green-100' : 'hover:bg-red-100';
    const closeIconClass = isSuccess ? 'text-green-500' : 'text-red-500';

    return (
        <div 
            className={`fixed bottom-4 right-4 z-50 transform transition-all duration-300 ${
                isClosing ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
            }`}
        >
            <div className={`rounded-lg shadow-lg overflow-hidden ${containerClass}`}>
                {/* Progress bar */}
                <div 
                    className={`h-1 transition-all duration-100 ${progressClass}`}
                    style={{ width: `${progress}%` }}
                />
                {/* Toast content */}
                <div className="flex items-center gap-3 px-4 py-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        {isSuccess ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    {/* Message */}
                    <p className={`text-sm font-medium flex-1 ${textClass}`}>
                        {message}
                    </p>
                    {/* Close button */}
                    <button
                        onClick={() => {
                            setIsClosing(true);
                            setTimeout(onClose, 300);
                        }}
                        className={`flex-shrink-0 p-1 rounded-full transition-colors ${closeHoverClass}`}
                    >
                        <XMarkIcon className={`w-4 h-4 ${closeIconClass}`} />
                    </button>
                </div>
            </div>
        </div>
    );
} 