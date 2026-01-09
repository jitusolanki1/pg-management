import React from 'react';

const variants = {
    success: 'bg-green-50 text-green-700 ring-green-600/20',
    warning: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/10',
    neutral: 'bg-gray-50 text-gray-600 ring-gray-500/10',
    primary: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10',
};

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
    return (
        <span className={`
      inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset
      ${variants[variant]}
      ${className}
    `}>
            {children}
        </span>
    );
};
