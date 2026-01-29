/**
 * Floating AI Coach Button
 * 
 * A floating action button that opens the AI Coach chat from any view.
 * Features:
 * - Always accessible floating button
 * - Slide-in chat panel
 * - Minimizable interface
 */

import React, { useState } from 'react';
import { MessageCircle, X, Sparkles, Volume2, VolumeX } from 'lucide-react';
import AICoachChat from './AICoachChat';

export const FloatingAICoach: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
        >
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg hover:scale-110 transition-all duration-300">
            <MessageCircle size={24} className="text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <div className="flex items-center gap-1">
              <Sparkles size={12} className="text-secondary" />
              Ask ARIA - AI Coach
            </div>
            <div className="absolute bottom-0 right-4 w-2 h-2 bg-slate-800 transform rotate-45 translate-y-1" />
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-surface rounded-xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
          <div className="h-full flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-900" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ARIA</h3>
                  <p className="text-[10px] text-slate-500">AI Assistant Coach</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 hover:bg-slate-700 rounded-lg transition-colors ${voiceEnabled ? 'bg-primary/20' : ''}`}
                  title={voiceEnabled ? "Voice enabled" : "Voice disabled"}
                >
                  {voiceEnabled ? (
                    <Volume2 size={14} className="text-primary" />
                  ) : (
                    <VolumeX size={14} className="text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <AICoachChat isExpanded={true} hideHeader={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAICoach;
