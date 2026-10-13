import React, { useState } from 'react';
import { Fingerprint, Delete, ShieldCheck, Lock } from 'lucide-react';

interface LockScreenProps {
  pin: string;
  biometricsEnabled: boolean;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ pin, biometricsEnabled, onUnlock }) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const handleKeyPress = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setError(null);
      if (next.length === 4) {
        if (next === pin) {
          onUnlock();
        } else {
          setError('Incorrect PIN. Default is 1234');
          setTimeout(() => setEnteredPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleBiometricScan = () => {
    setIsScanning(true);
    setError(null);
    setTimeout(() => {
      setIsScanning(false);
      onUnlock();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0b0f19] px-6 py-12 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">DhanTrack Locked</h1>
          <p className="mt-1 text-xs text-slate-400">Touch the fingerprint sensor or enter your 4-digit PIN</p>
        </div>
      </div>

      {/* PIN Dots */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'scale-110 bg-teal-400 shadow-md shadow-teal-500/50'
                    : 'border-2 border-slate-700 bg-slate-900'
                }`}
              />
            );
          })}
        </div>
        {error && <p className="text-xs font-medium text-rose-400 animate-pulse">{error}</p>}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs">
        <div className="grid grid-cols-3 gap-4 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-slate-900/80 text-xl font-semibold text-slate-100 border border-slate-800 transition-all hover:bg-slate-800 active:scale-95"
            >
              {num}
            </button>
          ))}

          {/* Biometric trigger button */}
          <button
            onClick={handleBiometricScan}
            disabled={!biometricsEnabled}
            title="Authenticate with Fingerprint"
            className={`flex h-16 w-16 mx-auto items-center justify-center rounded-2xl border transition-all ${
              biometricsEnabled
                ? 'border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 active:scale-95'
                : 'border-transparent text-slate-600 cursor-not-allowed'
            }`}
          >
            <Fingerprint className={`h-7 w-7 ${isScanning ? 'animate-pulse text-teal-300' : ''}`} />
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-slate-900/80 text-xl font-semibold text-slate-100 border border-slate-800 transition-all hover:bg-slate-800 active:scale-95"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            title="Delete digit"
            className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-slate-900/40 text-slate-400 border border-slate-800/60 hover:text-white transition-all active:scale-95"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>

        {/* Quick unlock helper */}
        <div className="mt-6 text-center">
          <button
            onClick={onUnlock}
            className="text-xs text-slate-500 hover:text-teal-400 underline decoration-slate-700 underline-offset-4"
          >
            Bypass Lock (Developer / Testing)
          </button>
        </div>
      </div>
    </div>
  );
};
