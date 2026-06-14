export interface OCProfile {
  name: string;
  visualStyle?: string;
  archetype?: string;
  personality?: string;
  ocDescription?: string;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  preview: string;
  messages: Message[];
  tag?: string;
}

export interface Message {
  role: 'user' | 'oc';
  text: string;
  time?: string;
  meta?: unknown;
}

export interface RuntimeInfo {
  native: boolean;
  hermes: { state?: string } | null;
  tts: { configured?: boolean; provider?: string } | null;
  airjelly: { source?: string } | null;
  lastError: string | null;
}

export interface Tweaks {
  blushOnIdle: boolean;
  accentHue: number;
  accentPreset: string;
  ambientDensity: string;
}

export type Lang = 'zh' | 'en';
export type ViewId = 'home' | 'chat' | 'world' | 'rewind' | 'memory' | 'settings' | 'create-oc';
