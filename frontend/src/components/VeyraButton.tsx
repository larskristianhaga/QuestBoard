

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CommandCenterPanel } from './CommandCenterPanel';

interface VeyraButtonProps {
  className?: string;
}

export const VeyraButton: React.FC<VeyraButtonProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find or create portal root
    let portal = document.getElementById('portal-root');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'portal-root';
      document.body.appendChild(portal);
    }
    setPortalElement(portal);

    // Load state from localStorage
    const savedState = localStorage.getItem('cc_open');
    if (savedState === 'true') {
      setIsOpen(true);
    }

    // Keyboard handler for Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('cc_open', String(newState));
    
    // Analytics events
    if (newState) {
      console.log('ui.cc_opened');
    } else {
      console.log('ui.cc_closed');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('cc_open', 'false');
    console.log('ui.cc_closed');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <>
      {/* Floating Veyra Button */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Open Command Center"
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 lg:w-16 lg:h-16
          rounded-full cursor-pointer
          bg-gradient-to-br from-slate-800 to-slate-900
          border border-cyan-400/30
          transition-all duration-300 ease-out
          hover:scale-105 hover:border-cyan-400/60
          focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
          ${className}
        `}
        style={{
          boxShadow: `
            0 0 12px #4de2e8,
            0 4px 20px rgba(77, 226, 232, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {/* Veyra Profile Placeholder */}
        <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center overflow-hidden">
          {/* Veyra Avatar - Cosmic AI Commander */}
          <img 
            src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/Commander Veyra.png"
            alt="Commander Veyra - AI Battle Coordinator"
            className="w-full h-full object-cover rounded-full"
            style={{
              filter: 'saturate(1.4) contrast(1.2) brightness(1.3) drop-shadow(0 0 10px rgba(34, 211, 238, 0.6))'
            }}
          />
        </div>
        
        {/* Enhanced Pulse Animation */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-pulse"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      </div>

      {/* Command Center Portal */}
      {portalElement && isOpen && createPortal(
        <CommandCenterPanel onClose={handleClose} />,
        portalElement
      )}
    </>
  );
};
