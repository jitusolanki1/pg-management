import React from 'react';

export const Card = ({ children, className = '', noPadding = false, ...props }) => {
    return (
        <div
            className={`bg-surface border border-border rounded-xl shadow-card ${className}`}
            {...props}
        >
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </div>
    );
};

export const CardHeader = ({ title, description, action }) => (
    <div className="flex items-center justify-between mb-6">
        <div>
            {title && <h3 className="text-lg font-semibold text-text-main">{title}</h3>}
            {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
        </div>
        {action && <div>{action}</div>}
    </div>
);
