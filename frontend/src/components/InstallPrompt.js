import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

const InstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    try {
      // Check if running on iOS
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(iOS);
      
      // Check if already installed (standalone mode) - multiple detection methods
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true ||
                        window.matchMedia('(display-mode: fullscreen)').matches ||
                        window.matchMedia('(display-mode: minimal-ui)').matches ||
                        document.referrer.includes('android-app://');

      setIsStandalone(standalone);

      // Check if install prompt is available
      if (window.deferredPrompt && !standalone) {
        setCanInstall(true);
      }

      // Only show for users who haven't installed yet and can install
      if (!standalone && (canInstall || iOS)) {
        // Check if user dismissed recently
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowInstallPrompt(true);
        } else {
          const dismissedTime = parseInt(dismissed);
          const now = Date.now();
          const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
          
          if (hoursSinceDismissed >= 24) {
            setShowInstallPrompt(true);
          }
        }
      }

      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e) => {
        setCanInstall(true);
        if (!standalone) {
          setShowInstallPrompt(true);
        }
      };

      // Listen for appinstalled event
      const handleAppInstalled = () => {
        setIsStandalone(true);
        setCanInstall(false);
        setShowInstallPrompt(false);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    } catch (error) {
      console.error('Error in InstallPrompt useEffect:', error);
      // If there's an error, don't show the prompt
      setShowInstallPrompt(false);
    }
  }, [canInstall]);

  const handleDismiss = () => {
    try {
      setShowInstallPrompt(false);
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    } catch (error) {
      console.error('Error dismissing install prompt:', error);
    }
  };

  // Don't show if already installed or if there was an error
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Download className="h-5 w-5 mr-2 text-blue-600" />
              Install KHPL
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm text-gray-600">
            Install KHPL on your device for quick access
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {canInstall ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Install KHPL on your device for quick access and offline functionality.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={async () => {
                      try {
                        if (window.deferredPrompt) {
                          await window.deferredPrompt.prompt();
                          const { outcome } = await window.deferredPrompt.userChoice;
                          if (outcome === 'accepted') {
                            handleDismiss();
                          }
                        }
                      } catch (error) {
                        console.error('Installation error:', error);
                      }
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Install Now
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDismiss}
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Smartphone className="h-4 w-4 mr-2" />
                  <span>iPhone/iPad: Tap Share → Add to Home Screen</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Monitor className="h-4 w-4 mr-2" />
                  <span>Desktop: Look for install icon in address bar</span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDismiss}
                  className="w-full mt-3"
                >
                  Got it
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;
