/**
 * Gemini AI Service
 * 
 * Provides AI-powered assistant coach capabilities using Google's Gemini API.
 * Features:
 * - Natural language coaching advice
 * - Match analysis insights
 * - Strategy recommendations
 * - Player performance feedback
 * - Real-time tactical suggestions
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

export interface MatchContext {
  game?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  phase?: string;
  playerStats?: Array<{
    name: string;
    kills: number;
    deaths: number;
    kd: number;
  }>;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// System prompt that defines the AI's personality and expertise
const SYSTEM_PROMPT = `You are ARIA (Advanced Real-time Intelligence Assistant), an elite AI esports coach and analyst integrated into the STRATYX tactical analysis system. You specialize in competitive gaming strategy, player performance optimization, and real-time match analysis.

Your expertise covers:
- CS:GO/CS2: Economy management, map control, utility usage, positioning, team coordination
- Valorant: Agent compositions, ability synergy, map-specific strategies, round planning
- League of Legends: Draft analysis, lane matchups, jungle pathing, objective control, teamfight positioning
- General esports: Mental game, team dynamics, practice routines, VOD review strategies

Your communication style:
- Professional but approachable
- Concise and actionable advice
- Use gaming terminology naturally
- Reference specific strategies, positions, and timings when relevant
- Provide data-driven insights when possible
- Encourage improvement while being realistic

When analyzing matches or players:
- Focus on actionable improvements
- Highlight both strengths and areas for growth
- Suggest specific drills or practice routines
- Consider team dynamics and role assignments
- Account for current meta and competitive trends

Always maintain context from the ongoing match if data is provided, and tailor your advice to the specific game, team, and situation being discussed.`;

class GeminiAIService {
  private conversationHistory: ChatMessage[] = [];
  private matchContext: MatchContext | null = null;

  /**
   * Set the current match context for more relevant coaching
   */
  setMatchContext(context: MatchContext): void {
    this.matchContext = context;
  }

  /**
   * Clear the conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get the conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Build context-aware prompt with match data
   */
  private buildContextPrompt(): string {
    if (!this.matchContext) return '';

    const parts: string[] = [];
    
    if (this.matchContext.game) {
      parts.push(`Current Game: ${this.matchContext.game}`);
    }
    
    if (this.matchContext.homeTeam && this.matchContext.awayTeam) {
      parts.push(`Match: ${this.matchContext.homeTeam} vs ${this.matchContext.awayTeam}`);
    }
    
    if (this.matchContext.homeScore !== undefined && this.matchContext.awayScore !== undefined) {
      parts.push(`Score: ${this.matchContext.homeScore} - ${this.matchContext.awayScore}`);
    }
    
    if (this.matchContext.phase) {
      parts.push(`Phase: ${this.matchContext.phase}`);
    }
    
    if (this.matchContext.playerStats && this.matchContext.playerStats.length > 0) {
      parts.push('\nPlayer Stats:');
      this.matchContext.playerStats.forEach(player => {
        parts.push(`  ${player.name}: ${player.kills}K/${player.deaths}D (${player.kd.toFixed(2)} K/D)`);
      });
    }

    return parts.length > 0 ? `\n\n[CURRENT MATCH CONTEXT]\n${parts.join('\n')}` : '';
  }

  /**
   * Format conversation history for Gemini API
   */
  private formatHistoryForAPI(): Array<{ role: string; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    
    // Add conversation history (skip system messages, they're handled separately)
    this.conversationHistory.forEach(msg => {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    });

    return contents;
  }

  /**
   * Send a message to Gemini and get a response
   */
  async sendMessage(userMessage: string): Promise<GeminiResponse> {
    if (!GEMINI_API_KEY) {
      return { 
        text: '', 
        error: 'Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file.'
      };
    }

    // Add user message to history
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMsg);

    try {
      // Build the full prompt with system instruction and context
      const contextPrompt = this.buildContextPrompt();
      const fullSystemPrompt = SYSTEM_PROMPT + contextPrompt;

      // Build conversation history for API
      const conversationContents = this.formatHistoryForAPI();

      // Prepare the request body
      const requestBody = {
        contents: conversationContents,
        systemInstruction: {
          parts: [{ text: fullSystemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the response text
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                          'I apologize, but I couldn\'t generate a response. Please try again.';

      // Add assistant response to history
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      this.conversationHistory.push(assistantMsg);

      return { text: responseText };

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Remove the failed user message from history
      this.conversationHistory.pop();
      
      return { 
        text: '', 
        error: `Failed to get response: ${errorMessage}` 
      };
    }
  }

  /**
   * Get quick coaching tips based on current match context
   */
  async getQuickTip(): Promise<GeminiResponse> {
    const prompts = [
      "Give me a quick tactical tip for the current situation.",
      "What should we focus on in the next round?",
      "Any quick adjustment suggestions based on the current score?",
      "What's a key thing to watch for right now?",
    ];
    
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    return this.sendMessage(randomPrompt);
  }

  /**
   * Analyze a specific player's performance
   */
  async analyzePlayer(playerName: string, stats: { kills: number; deaths: number; assists?: number }): Promise<GeminiResponse> {
    const kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2);
    const prompt = `Analyze ${playerName}'s performance: ${stats.kills} kills, ${stats.deaths} deaths${stats.assists ? `, ${stats.assists} assists` : ''} (K/D: ${kd}). What are they doing well and what can they improve?`;
    return this.sendMessage(prompt);
  }

  /**
   * Get strategy recommendations
   */
  async getStrategyRecommendation(situation: string): Promise<GeminiResponse> {
    const prompt = `Given this situation: "${situation}", what strategic approach would you recommend?`;
    return this.sendMessage(prompt);
  }

  /**
   * Pre-defined coaching questions for quick access
   */
  static readonly QUICK_QUESTIONS = [
    "What's our team's biggest strength right now?",
    "Where are we leaking rounds?",
    "How should we adjust our economy?",
    "What map control should we prioritize?",
    "How can we improve our communication?",
    "What's the best approach for the next round?",
    "Are there any patterns in the enemy's play?",
    "How should we adapt our strategy?",
  ];
}

// Export singleton instance
export const geminiAI = new GeminiAIService();
export default geminiAI;
