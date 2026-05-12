import React from 'react';
import { Navigate } from 'react-router-dom';

const ModuleGuard = ({ module, children }) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const selectedModules = userInfo.selectedModules;
    
    // Check if the property exists to distinguish between legacy/no-data and proper empty array
    const hasOnboarded = Array.isArray(selectedModules) && selectedModules.length > 0;

    if (!hasOnboarded && userInfo.role === 'Owner') {
        return <Navigate to="/onboarding" replace />;
    }

    if (module && hasOnboarded && !selectedModules.includes(module)) {
        // If they don't have access to this module, redirect them
        const isRestrictedRole = ['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo.role);
        const redirectPath = isRestrictedRole ? '/production' : '/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ModuleGuard;
