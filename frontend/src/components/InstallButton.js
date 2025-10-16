import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

const InstallButton = ({ 
  variant = "outline", 
  size = "sm", 
  showIcon = true, 
  showText = true,
  className = "",
  children,
  tooltipPosition = "auto",
  title = "Install KHPL as an app"
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [message, setMessage] = useState('');
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if PWA is already installed
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.matchMedia('(display-mode: minimal-ui)').matches ||
             window.matchMedia('(display-mode: fullscreen)').matches ||
             window.navigator.standalone === true ||
             document.referrer.includes('android-app://');
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);

    // Use global deferred prompt if available
    if (window.deferredPrompt && !standalone) {
      setDeferredPrompt(window.deferredPrompt);
      setCanInstall(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstalling(false);
      setCanInstall(false);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
      setMessage('KHPL has been installed successfully!');
      setTimeout(() => setMessage(''), 3000);
    };

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'APP_INSTALLED') {
        handleAppInstalled();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const handleInstallClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
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

    setIsInstalling(true);
    showMessage("Installing KHPL...");

    try {
      // Use deferred prompt if available
      if (deferredPrompt) {
        const result = await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          showMessage("Installation accepted! KHPL is being installed...");
          setDeferredPrompt(null);
          window.deferredPrompt = null;
        } else {
          showMessage("Installation declined");
        }
      } else {
        // No prompt available, show instructions
        if (isIOS) {
          showMessage("iOS detected. Please tap Share → Add to Home Screen", 5000);
        } else {
          showMessage("Installation not available. Please look for the install icon in your browser's address bar.", 5000);
        }
      }
    } catch (error) {
      console.error('Installation error:', error);
      showMessage("Installation failed. Please try again.");
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already installed or if installation is not available
  if (isStandalone || (!canInstall && !isIOS)) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleInstallClick}
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        disabled={isInstalling}
        title={title}
        type="button"
      >
        {showIcon && <Download className="h-4 w-4" />}
        {showText && (children || (isInstalling ? "Installing..." : "Install App"))}
      </Button>
      
      {/* Descriptive text for login page */}
      {showText && className.includes('border-t') && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Install for quick access and offline functionality
        </p>
      )}
      
      {/* Message display */}
      {message && (
        <div className={`absolute top-full mt-2 bg-gray-800 text-white text-xs rounded px-3 py-2 z-50 max-w-xs break-words shadow-lg ${
          tooltipPosition === "right" ? 'right-0' : 
          tooltipPosition === "left" ? 'left-0' : 
          showText ? 'left-0' : 'right-0'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default InstallButton;