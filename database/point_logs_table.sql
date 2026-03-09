-- 포인트 로그 테이블 생성
create table public.point_logs (
  id text not null default gen_random_uuid (),
  user_id uuid not null,
  amount integer not null,
  type text not null check (type in ('charge', 'usage')),
  description text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint point_logs_pkey primary key (id),
  constraint point_logs_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- 인덱스 생성 (성능 최적화)
create index if not exists idx_point_logs_user_id on public.point_logs using btree (user_id) tablespace pg_default;
create index if not exists idx_point_logs_created_at on public.point_logs using btree (created_at desc) tablespace pg_default;
create index if not exists idx_point_logs_type on public.point_logs using btree (type) tablespace pg_default;

-- RLS (Row Level Security) 정책 활성화
alter table public.point_logs enable row level security;

-- RLS 정책 생성: 사용자는 자신의 로그만 조회/삽입 가능
create policy "Users can only access their own point logs" 
on public.point_logs 
for all 
using (auth.uid() = user_id);

-- 테스트 데이터 삽입 (선택사항)
-- insert into public.point_logs (user_id, amount, type, description) values
-- ('USER_UUID_HERE', 1000, 'charge', '포인트 충전 - 1000P'),
-- ('USER_UUID_HERE', 1, 'usage', 'AI 퀴즈 생성 (10문제)'),
-- ('USER_UUID_HERE', 2, 'usage', 'AI 퀴즈 생성 (20문제)');