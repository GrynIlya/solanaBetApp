"use client";

import { useState, useEffect } from "react";
import { User, Sparkles, X } from "lucide-react";

interface NameModalProps {
  isOpen: boolean;
  onComplete: (name: string) => void | Promise<void>;
  onClose?: () => void;
  initialName?: string;
  isSaving?: boolean;
}

export function NameModal({ isOpen, onComplete, onClose, initialName = "", isSaving = false }: NameModalProps) {
  const [name, setName] = useState(initialName);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSaving) {
      // Разрешаем пустое имя - передаем пустую строку или trimmed версию
      await onComplete(name.trim());
    }
  };

  const exampleNames = ['CryptoWhale', 'LastStand', 'TimeKeeper', '🚀 Degen', '勝利者'];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - сразу непрозрачный */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Modal with animation - без анимации прозрачности */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`relative w-full max-w-md pointer-events-auto transition-transform duration-300 ${
            isAnimating 
              ? 'scale-100 translate-y-0' 
              : 'scale-95 translate-y-4'
          }`}
        >
          {/* Glow effect - статичный, без анимации */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/8 to-purple-500/10 blur-3xl rounded-3xl" />
          
          {/* Main card */}
          <div className="relative bg-gradient-to-br from-gray-900/98 via-gray-900/95 to-black/98 border border-white/20 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Animated border glow - без hover эффекта */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-500" />
            
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all z-10 hover:scale-110 hover:rotate-90 group"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            )}

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-10">
              {/* Icon with animation */}
              <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-bounce-slow relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/50 to-blue-400/50 rounded-2xl animate-ping opacity-20" />
                <User className="w-10 h-10 text-white relative z-10" />
              </div>

              {/* Title - centered */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                  Choose Your Name
                </h2>
                <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                  This name will be displayed when you make the final move and claim the jackpot. You can leave it empty to use your wallet address.
                </p>
              </div>

              {/* Input - centered */}
              <div className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name or nickname"
                    maxLength={30}
                    autoFocus
                    className="w-full px-6 py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-gray-500 text-center text-lg font-medium focus:outline-none focus:border-purple-500/50 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                  />
                  {name && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                </div>
                
                {/* Character count - centered */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <p className="text-xs text-gray-500 text-center">
                    Any language · No verification · Can be changed later
                  </p>
                </div>
                <div className="text-center mt-2">
                  <span className="text-xs text-gray-600 font-mono">{name.length}/30</span>
                </div>
              </div>

              {/* Submit button - centered */}
              <button
                type="submit"
                disabled={isSaving}
                className="group relative w-full px-8 py-5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(139,92,246,0.8)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative font-bold text-white text-lg uppercase tracking-wider flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving to blockchain...
                    </>
                  ) : (
                    "Continue"
                  )}
                </span>
              </button>

              {/* Example names suggestion - centered */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-xs text-gray-600 mb-4 text-center uppercase tracking-wider">Quick Examples</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {exampleNames.map((example, index) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setName(example)}
                      className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-purple-500/50 hover:scale-105 transition-all duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

    </>
  );
}
