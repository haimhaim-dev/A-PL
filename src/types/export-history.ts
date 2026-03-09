export interface ExportHistory {
  id: string;
  user_id: string;
  quiz_id: string;
  exported_at: string;
  file_name: string;
  file_path: string;
  Quiz?: {
    id: string;
    title: string;
  };
}

export interface ExportHistoryInsert {
  user_id: string;
  quiz_id: string;
  file_name: string;
  file_path: string;
}