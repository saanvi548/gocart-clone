'use client'
import React from 'react'
import toast from 'react-hot-toast';

export default function Banner() {

    const [isOpen, setIsOpen] = React.useState(true);

    const handleClaim = () => {
        setIsOpen(false);
        const couponCode = 'NEW20';
        
        // Use document.execCommand('copy') for better compatibility in iFrame environments
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = couponCode;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            toast.success(`Coupon "${couponCode}" copied to clipboard!`);
        } catch (err) {
            toast.error('Failed to copy coupon.');
        }
    };

    // The suppressHydrationWarning prop is added to the buttons below
    // to ignore the externally injected fdprocessedid attribute.
    return isOpen && (
        <div className="w-full px-6 py-1 font-medium text-sm text-white text-center bg-gradient-to-r from-violet-500 via-[#9938CA] to-[#E0724A]">
            <div className='flex items-center justify-between max-w-7xl  mx-auto'>
                <p>Get 20% OFF on Your First Order!</p>
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={handleClaim} 
                        type="button" 
                        className="font-normal text-gray-800 bg-white px-7 py-2 rounded-full max-sm:hidden"
                        suppressHydrationWarning={true} // Hydration Fix
                    >
                        Claim Offer
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        type="button" 
                        className="font-normal text-gray-800 py-2 rounded-full"
                        suppressHydrationWarning={true} // Hydration Fix
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect y="12.532" width="17.498" height="2.1" rx="1.05" transform="rotate(-45.74 0 12.532)" fill="#fff" />
                            <rect x="12.533" y="13.915" width="17.498" height="2.1" rx="1.05" transform="rotate(-135.74 12.533 13.915)" fill="#fff" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};