import React from 'react';

const SessionExpiredModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999, padding: '16px' }}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full" style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
        <div className="text-center" style={{ textAlign: 'center' }}>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4" style={{ margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', width: '48px', borderRadius: '50%', backgroundColor: '#fee2e2' }}>
            <svg className="h-6 w-6 text-red-600" style={{ height: '24px', width: '24px', color: '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900" style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 500, color: '#111827', margin: '0 0 8px' }}>
            Session Expired
          </h3>
          <div className="mt-2 mb-6" style={{ marginTop: '8px', marginBottom: '24px' }}>
            <p className="text-sm text-gray-500" style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Your session has expired or the token is invalid. Please log in again to continue.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', borderRadius: '6px', border: '1px solid transparent', padding: '8px 16px', backgroundColor: '#dc2626', color: '#fff', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            Log In Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
