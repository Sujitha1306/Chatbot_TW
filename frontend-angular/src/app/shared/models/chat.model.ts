export type MessageRole   = 'user' | 'assistant';
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';
export type Domain        = 'porter' | 'asset' | 'both' | 'conversational';
export type ChartType     = 'bar' | 'line' | 'pie' | 'scatter' | 'table';

export interface ChartSpec {
  recommendations: { type: ChartType; label: string; x: string; y: string; icon: string; sort_x_as?: string; sort_x_by?: string }[];
  active: ChartType;
  columns: { numeric: string[]; categorical: string[]; date: string[]; dimensions?: string[]; measures?: string[] };
  row_count: number;
  single_value?: boolean;
  fallback_reason?: string | null;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sql?: string;
  data?: Record<string, unknown>[];
  rowCount?: number;
  domain?: Domain;
  chartSpec?: ChartSpec;
  displaySections?: { label: string; data: Record<string, unknown>[] }[];
  crossConversationRefs?: { conversation_id: string; title: string }[];
  followups?: string[];
  suggestions?: string[];
  status: MessageStatus;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: Date;
}
