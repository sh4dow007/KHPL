import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, Smartphone, Monitor } from 'lucide-react';

const InstallButton = ({ 
  variant = "outline", 
  size = "sm", 
  showIcon = true, 
  showText = true,
  className = "",
  children 
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
    setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleInstallClick = async () => {
    // Check if PWA is supported
    if (!('serviceWorker' in navigator)) {
      showMessage("PWA not supported in this browser");
      return;
    }

    // If already installed, show message
    if (isStandalone) {
      showMessage("KHPL is already installed on your device");
      return;
    }

    // Try to trigger install prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          showMessage("KHPL is being installed...");
        } else {
          showMessage("Installation cancelled");
        }
        
        // Clear the deferredPrompt so it can only be used once
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error showing install prompt:', error);
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    if (isIOS) {
      showMessage("iPhone/iPad: Tap Share → Add to Home Screen");
    } else {
      showMessage("Look for the install icon in your browser's address bar");
    }
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        className={`${className} ${showIcon ? 'flex items-center gap-2' : ''}`}
        onClick={handleInstallClick}
        title="Install KHPL as an app"
      >
        {showIcon && <Download className="h-4 w-4" />}
        {showText && (children || "Install App")}
      </Button>
      
      {/* Message display */}
      {message && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 text-white text-xs rounded px-2 py-1 z-50 whitespace-nowrap">
          {message}
        </div>
      )}
    </div>
  );
};

export default InstallButton;
