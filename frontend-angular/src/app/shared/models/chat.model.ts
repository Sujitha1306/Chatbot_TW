export type MessageRole   = 'user' | 'assistant';
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';
export type Domain        = 'porter' | 'asset' | 'both';
export type ChartType     = 'bar' | 'line' | 'pie' | 'scatter' | 'table';

export interface ChartSpec {
  recommendations: { type: ChartType; label: string; x: string; y: string; icon: string }[];
  active: ChartType;
  columns: { numeric: string[]; categorical: string[]; date: string[] };
  row_count: number;
  single_value?: boolean;
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
  followups?: string[];
  status: MessageStatus;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: Date;
}
