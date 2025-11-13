// SVG Icons personalizados para dados
export const D4Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 20h20L12 2zm0 4.83L18.17 18H5.83L12 6.83z"/>
    </svg>
);

export const D6Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="12" cy="12" r="1.5" fill="white"/>
    </svg>
);

export const D8Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l-10 8v4l10 8 10-8v-4L12 2zm0 3.5L18.5 10v2.5L12 17l-6.5-4.5V10L12 5.5z"/>
    </svg>
);

export const D10Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 3l5 3v7l-5 3-5-3V8l5-3z"/>
    </svg>
);

export const D12Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l-7 4v8l7 8 7-8V6l-7-4zm0 3l4.5 2.5v5.5l-4.5 5.5-4.5-5.5V7.5L12 5z"/>
    </svg>
);

export const D20Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 8v8l10 6 10-6V8L12 2zm0 2.5l7 4v7l-7 4.5-7-4.5v-7l7-4z"/>
        <path d="M12 7v10M7 9.5l10 5M7 14.5l10-5" stroke="white" strokeWidth="0.5" fill="none"/>
    </svg>
);

export const D100Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="12" r="7"/>
        <circle cx="15" cy="12" r="7"/>
        <text x="5.5" y="15" fontSize="8" fill="white" fontWeight="bold">0</text>
        <text x="11.5" y="15" fontSize="8" fill="white" fontWeight="bold">0</text>
    </svg>
);
