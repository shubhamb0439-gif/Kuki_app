import React, { useState, useEffect } from 'react';
import { Smartphone, Info, Circle, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { isMobileDevice, isLandscape as checkIsLandscape } from '../../lib/deviceHelper';

export function OrientationLock({ children }: { children: React.ReactNode }) {
  const [showHelpPage, setShowHelpPage] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = isMobileDevice();
      const isLandscapeMode = checkIsLandscape();
      setShowHelpPage(isMobile && isLandscapeMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (showHelpPage) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 animate-scaleIn my-4">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-2 sm:mb-3 animate-pulse">
              <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">Welcome to KUKI</h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">Your Smart Workforce Management App</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 animate-fadeIn">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Please Rotate Your Device</h2>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 text-center">
              For the best experience, please use KUKI in portrait (vertical) mode.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-green-200 transform hover:scale-105 transition-all duration-200">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                About KUKI
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 text-gray-700 text-xs sm:text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                  <span>Seamless employer-employee management</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                  <span>QR code-based attendance and payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                  <span>Real-time job postings and applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                  <span>Comprehensive wage and loan tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                  <span>Performance ratings and attendance calendar</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-purple-200 transform hover:scale-105 transition-all duration-200">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                Status Ring Guide
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center text-[8px] sm:text-xs font-bold">
                      NO
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">No Ring</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Available / No pending actions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 sm:border-3 md:border-4 border-green-500 animate-pulse-slow" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Green Ring</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Approved action / Ready to proceed</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 sm:border-3 md:border-4 border-yellow-500 animate-pulse-slow" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Yellow Ring</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Pending action / Awaiting response</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 sm:border-3 md:border-4 border-red-500 animate-pulse-slow" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Red Ring</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Issue detected / Action required</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              Rotate your device to portrait mode to access all features
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
