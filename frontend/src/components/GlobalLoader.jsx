import React, { useState, useEffect } from 'react';
import './GlobalLoader.css'; // Don't forget to create this CSS file

const GlobalLoader = () => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleStart = () => setIsLoading(true);
        const handleStop = () => setIsLoading(false);

        window.addEventListener('global-loading-start', handleStart);
        window.addEventListener('global-loading-stop', handleStop);

        return () => {
            window.removeEventListener('global-loading-start', handleStart);
            window.removeEventListener('global-loading-stop', handleStop);
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div className="global-loader-overlay global-loader-fade-in">
            <div className="global-loading-spinner"></div>
            <h3 className="global-loading-text">PROCESSING...</h3>
        </div>
    );
};

export default GlobalLoader;
