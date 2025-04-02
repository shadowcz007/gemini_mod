export interface Settings {
  mcpServiceUrl: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface Entity {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

export interface Relationship {
  id: string;
  from: string;
  to: string;
  label: string;
  properties: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}