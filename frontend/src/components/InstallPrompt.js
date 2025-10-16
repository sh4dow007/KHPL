import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

const InstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    try {
      // Check if running on iOS
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(iOS);
      
      // Check if already installed (standalone mode) - multiple detection methods
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true ||
                        window.matchMedia('(display-mode: fullscreen)').matches ||
                        (window.screen && window.screen.height === window.innerHeight && window.screen.width === window.innerWidth);

      setIsStandalone(standalone);

      // Only show for iOS users who haven't installed yet
      if (iOS && !standalone) {
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
    } catch (error) {
      console.error('Error in InstallPrompt useEffect:', error);
      // If there's an error, don't show the prompt
      setShowInstallPrompt(false);
    }
  }, []);

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
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;
