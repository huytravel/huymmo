export enum ApiProvider {
  GEMINI = 'Gemini',
  AIVND_HUB = 'AIVND Hub',
  OPENAI = 'OpenAI',
  OPENROUTER = 'OpenRouter',
}

export interface AIVNDHubSettings {
  endpoint: string;
  model: string;
}

export interface OpenRouterSettings {
  model: string;
}

export interface CharacterProfile {
  nationality: string;
  age: string;
  skinColor: string;
  hairLength: string;
  hairColor: string;
  shirt: string;
  pants: string;
}

export interface OutlineSection {
  title: string;
  wordTarget: string;
  paragraphTarget: string;
  description: string;
}

export interface ScriptPart {
  content: string;
}

export interface ApiKey {
  key: string;
  provider: ApiProvider;
  lastUsed: number;
  exhaustedUntil?: number;
}

export type ValidationStatus = 'valid' | 'invalid' | 'quota' | 'rate_limited' | 'error' | 'pending' | 'idle' | 'cooldown';
export type StatusObject = { status: ValidationStatus; message: string };