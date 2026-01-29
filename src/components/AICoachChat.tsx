/**
 * AI Coach Chat Component
 * 
 * Interactive chat interface for the AI Assistant Coach powered by Gemini.
 * Features:
 * - Real-time conversation with AI coach
 * - Match context awareness
 * - Quick action buttons
 * - Message history
 * - Typing indicators
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Lightbulb,
  X,
  Maximize2,
  Minimize2,
  MessageCircle,
  Volume2,
  VolumeX,
  Square
} from 'lucide-react';
import geminiAI, { ChatMessage } from '../services/geminiAIService';
import { useCoachAnalytics } from '../contexts/CoachAnalyticsContext';

// Quick questions for the chat
const QUICK_QUESTIONS = [
  "What's our team's biggest strength right now?",
  "Where are we leaking rounds?",
  "How should we adjust our economy?",
  "What map control should we prioritize?",
  "How can we improve our communication?",
  "What's the best approach for the next round?",
  "Are there any patterns in the enemy's play?",
  "How should we adapt our strategy?",
];

interface AICoachChatProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  hideHeader?: boolean;
}

export const AICoachChat: React.FC<AICoachChatProps> = ({ 
  isExpanded = true, 
  onToggleExpand,
  hideHeader = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const { analyzedSeries, selectedSeries } = useCoachAnalytics();

  // Text-to-Speech function with natural female voice
  const speakText = useCallback((text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean up markdown and emojis for better speech
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '')   // Remove italic markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/`[^`]*`/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
      .replace(/[🎮👋🔄⚡🎯💡🛡️📊📈⚠️]/g, '') // Remove common emojis
      .trim();
    
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    speechSynthRef.current = utterance;
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Priority list for natural-sounding female voices (best first)
    const preferredFemaleVoices = [
      // Microsoft Neural voices (most natural)
      'Microsoft Aria Online (Natural)',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Zira',
      'Microsoft Zira Online (Natural)',
      'Microsoft Sonia Online (Natural)',
      // Google voices
      'Google UK English Female',
      'Google US English Female',
      'Google US English',
      // Apple voices
      'Samantha',
      'Victoria',
      'Karen',
      'Moira',
      'Tessa',
      // Other common female voices
      'Zira',
      'Hazel',
      'Susan',
      'Catherine',
      'Female',
    ];
    
    // Find the best available female voice
    let selectedVoice = null;
    
    for (const preferredName of preferredFemaleVoices) {
      const found = voices.find(v => 
        v.name.includes(preferredName) && v.lang.startsWith('en')
      );
      if (found) {
        selectedVoice = found;
        break;
      }
    }
    
    // Fallback: any English female-sounding voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('woman') ||
         v.name.includes('Zira') ||
         v.name.includes('Samantha'))
      );
    }
    
    // Final fallback: any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Configure for natural speech
    utterance.rate = 1.05;   // Slightly faster for energetic coach feel
    utterance.pitch = 1.1;   // Slightly higher pitch for female voice
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    // Load voices (they load asynchronously in some browsers)
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Update match context when series data changes
  useEffect(() => {
    if (analyzedSeries?.state) {
      const teams = analyzedSeries.state.teams || [];
      const games = analyzedSeries.state.games || [];
      
      // Build player stats
      const playerStats: Array<{ name: string; kills: number; deaths: number; kd: number }> = [];
      games.forEach(game => {
        game.teams.forEach(gameTeam => {
          gameTeam.players.forEach(player => {
            const existing = playerStats.find(p => p.name === player.name);
            if (existing) {
              existing.kills += player.kills || 0;
              existing.deaths += player.deaths || 0;
              existing.kd = existing.deaths > 0 ? existing.kills / existing.deaths : existing.kills;
            } else {
              const kills = player.kills || 0;
              const deaths = player.deaths || 0;
              playerStats.push({
                name: player.name,
                kills,
                deaths,
                kd: deaths > 0 ? kills / deaths : kills
              });
            }
          });
        });
      });

      geminiAI.setMatchContext({
        game: selectedSeries?.title?.name || 'Unknown',
        homeTeam: teams[0]?.name || 'Team 1',
        awayTeam: teams[1]?.name || 'Team 2',
        homeScore: teams[0]?.score || 0,
        awayScore: teams[1]?.score || 0,
        playerStats: playerStats.slice(0, 10) // Top 10 players
      });
    }
  }, [analyzedSeries, selectedSeries]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    const hasMatchContext = (analyzedSeries?.state?.teams?.length ?? 0) > 0;
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: hasMatchContext 
        ? "👋 Hey! I'm **ARIA**, your AI Assistant Coach. I can see you have a match loaded! I'm ready to help with tactical analysis, strategy recommendations, and player performance insights. Ask me anything about your match, or use the quick actions below to get started!"
        : "👋 Hey! I'm **ARIA**, your AI Assistant Coach. **Please select a match first** from the dashboard to unlock my full coaching capabilities! Once you load a match, I'll be able to analyze player performance, suggest strategies, and provide real-time tactical insights tailored to your game.",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    // Speak welcome message if auto-speak is enabled
    if (autoSpeak && hasMatchContext) {
      speakText("Hey! I'm ARIA, your AI Assistant Coach. I'm ready to help with tactical analysis and strategy recommendations!");
    }
  }, [analyzedSeries]);

  const handleSendMessage = useCallback(async (message?: string) => {
    const textToSend = message || inputValue.trim();
    if (!textToSend || isLoading) return;

    // Check if match is selected
    const hasMatchContext = (analyzedSeries?.state?.teams?.length ?? 0) > 0;

    setInputValue('');
    setError(null);
    setIsLoading(true);
    setShowQuickActions(false);

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // If no match selected, remind user but still allow general questions
    if (!hasMatchContext) {
      const reminderMessage: ChatMessage = {
        id: `reminder-${Date.now()}`,
        role: 'assistant',
        content: "⚠️ **No match selected!** For the best coaching experience, please select a match from the dashboard first. I can still answer general esports questions, but I won't have specific match data to analyze.\n\nLet me try to help with your question anyway...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reminderMessage]);
    }

    try {
      const response = await geminiAI.sendMessage(textToSend);
      
      if (response.error) {
        setError(response.error);
      } else {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Auto-speak the response if enabled
        if (autoSpeak) {
          speakText(response.text);
        }
      }
    } catch (err) {
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, autoSpeak, speakText, analyzedSeries]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    geminiAI.clearHistory();
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: "Chat cleared! 🔄 How can I help you with your match analysis?",
      timestamp: new Date()
    }]);
    setShowQuickActions(true);
    setError(null);
  };

  const quickActions = [
    { icon: <Target size={14} />, label: 'Match Analysis', prompt: 'Analyze the current match state and give me tactical insights.' },
    { icon: <TrendingUp size={14} />, label: 'Improvement Tips', prompt: 'What are the key areas we should focus on improving?' },
    { icon: <Shield size={14} />, label: 'Defense Strategy', prompt: 'Suggest defensive strategies for our current situation.' },
    { icon: <Zap size={14} />, label: 'Quick Tip', prompt: 'Give me a quick tactical tip for winning the next round.' },
  ];

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-primary to-secondary p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        <MessageCircle size={24} className="text-white" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-surface/50 backdrop-blur-sm ${isExpanded ? '' : 'max-h-96'}`}>
      {/* Header - conditionally rendered */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-surface/80">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot size={20} className="text-primary" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1">
                ARIA
                <Sparkles size={12} className="text-secondary" />
              </h3>
              <p className="text-[10px] text-slate-500">AI Assistant Coach</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Speaking indicator / Stop button */}
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors bg-primary/20"
                title="Stop speaking"
              >
                <Square size={14} className="text-primary animate-pulse" />
              </button>
            ) : (
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-1.5 hover:bg-slate-700 rounded transition-colors ${autoSpeak ? 'bg-primary/20' : ''}`}
                title={autoSpeak ? "Voice enabled - Click to disable" : "Voice disabled - Click to enable"}
              >
                {autoSpeak ? (
                  <Volume2 size={14} className="text-primary" />
                ) : (
                  <VolumeX size={14} className="text-slate-400" />
                )}
              </button>
            )}
            <button
              onClick={handleClearChat}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
              title="Clear chat"
            >
              <Trash2 size={14} className="text-slate-400 hover:text-white" />
            </button>
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                title={isExpanded ? "Minimize" : "Maximize"}
              >
                {isExpanded ? (
                  <Minimize2 size={14} className="text-slate-400 hover:text-white" />
                ) : (
                  <Maximize2 size={14} className="text-slate-400 hover:text-white" />
                )}
              </button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
              title="Hide"
            >
              <X size={14} className="text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-primary/20 text-primary' 
                : 'bg-gradient-to-br from-primary/30 to-secondary/30 text-secondary'
            }`}>
              {message.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-3 py-2 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-primary/20 text-white rounded-br-sm'
                  : 'bg-slate-800/80 text-slate-200 rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
              <div className={`flex items-center gap-2 mt-1 px-1 ${message.role === 'user' ? 'justify-end' : ''}`}>
                <p className="text-[10px] text-slate-600">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => speakText(message.content)}
                    className="text-slate-600 hover:text-primary transition-colors"
                    title="Read aloud"
                  >
                    <Volume2 size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
              <Bot size={14} className="text-secondary" />
            </div>
            <div className="bg-slate-800/80 px-3 py-2 rounded-lg rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && messages.length <= 1 && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Lightbulb size={10} />
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(action.prompt)}
                className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-primary/30 rounded text-xs text-slate-300 hover:text-white transition-all"
              >
                <span className="text-primary">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions Toggle */}
      {messages.length > 1 && (
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="mx-3 mb-2 flex items-center justify-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Lightbulb size={10} />
          {showQuickActions ? 'Hide' : 'Show'} suggestions
          {showQuickActions ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      )}

      {/* Expanded Quick Questions */}
      {showQuickActions && messages.length > 1 && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            {QUICK_QUESTIONS.slice(0, 4).map((question: string, index: number) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                className="px-2 py-1 bg-slate-800/30 hover:bg-slate-700/50 border border-slate-700/30 hover:border-primary/30 rounded-full text-[10px] text-slate-400 hover:text-white transition-all"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-surface/80">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your AI coach..."
            className="flex-1 bg-slate-800/50 border border-slate-700 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="px-3 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-1.5 text-center">
          Powered by Google Gemini • AI responses are suggestions only
        </p>
      </div>
    </div>
  );
};

export default AICoachChat;
