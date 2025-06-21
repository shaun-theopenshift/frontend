import { useState, useRef, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface InfoTooltipProps {
    content: string;
    className?: string;
}

export default function InfoTooltip({ content, className = '' }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle click outside for mobile
    useEffect(() => {
        if (!isMobile || !isVisible) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile, isVisible]);

    return (
        <div className="relative inline-block" ref={tooltipRef}>
            <button
                onClick={() => isMobile && setIsVisible(!isVisible)}
                onMouseEnter={() => !isMobile && setIsVisible(true)}
                onMouseLeave={() => !isMobile && setIsVisible(false)}
                className={`inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#2954bd] focus:ring-offset-2 ${className}`}
                aria-label="More information"
            >
                <InformationCircleIcon className="w-5 h-5 text-[#2954bd]" />
            </button>

            {/* Tooltip */}
            <div
                className={`absolute z-50 w-72 transform transition-all duration-200 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                } ${
                    isMobile
                        ? 'fixed left-1/2 -translate-x-1/2 bottom-4 mx-4 shadow-xl'
                        : 'left-1/2 -translate-x-1/2 -top-2 -translate-y-full'
                }`}
            >
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-4">
                    {/* Arrow */}
                    {!isMobile && (
                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-100 transform rotate-45" />
                    )}
                    
                    {/* Content */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {content}
                    </p>

                    {/* Close button for mobile */}
                    {isMobile && (
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
} 