export interface PointLog {
  id: string;
  user_id: string;
  amount: number;
  type: 'charge' | 'usage';
  description: string;
  created_at: string;
}

export interface PointLogInsert {
  user_id: string;
  amount: number;
  type: 'charge' | 'usage';
  description: string;
}

export type PointLogType = 'all' | 'charge' | 'usage';