-- Sakura & Sawasdee — Initial Schema
-- Run via: supabase db push  OR  paste into Supabase SQL editor

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: owner can read own" on profiles
  for select using (auth.uid() = id);

create policy "profiles: owner can upsert own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles: owner can update own" on profiles
  for update using (auth.uid() = id);

-- Friends need to read each other's display name
create policy "profiles: friends can read" on profiles
  for select using (
    exists (
      select 1 from friendships f
      where f.accepted = true
        and (
          (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
          or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
        )
    )
  );

-- ── SRS Cards ─────────────────────────────────────────────────────────────────
create table if not exists srs_cards (
  user_id        uuid not null references auth.users on delete cascade,
  vocab_id       text not null,
  due            bigint not null default 0,
  stability      real not null default 0,
  difficulty     real not null default 0,
  elapsed_days   integer not null default 0,
  scheduled_days integer not null default 0,
  reps           integer not null default 0,
  lapses         integer not null default 0,
  state          smallint not null default 0,
  last_review    bigint not null default 0,
  primary key (user_id, vocab_id)
);

alter table srs_cards enable row level security;

create policy "srs_cards: owner only" on srs_cards
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Room States ───────────────────────────────────────────────────────────────
create table if not exists room_states (
  user_id      uuid primary key references auth.users on delete cascade,
  placed       jsonb not null default '[]',
  display_case jsonb not null default '[]',
  updated_at   timestamptz not null default now()
);

alter table room_states enable row level security;

create policy "room_states: owner can write" on room_states
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "room_states: friends can read" on room_states
  for select using (
    exists (
      select 1 from friendships f
      where f.accepted = true
        and (
          (f.requester_id = auth.uid() and f.addressee_id = room_states.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = room_states.user_id)
        )
    )
  );

-- ── Friendships ───────────────────────────────────────────────────────────────
create table if not exists friendships (
  requester_id uuid not null references auth.users on delete cascade,
  addressee_id uuid not null references auth.users on delete cascade,
  accepted     boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table friendships enable row level security;

create policy "friendships: participants can read" on friendships
  for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "friendships: requester can insert" on friendships
  for insert with check (auth.uid() = requester_id);

create policy "friendships: addressee can accept" on friendships
  for update using (auth.uid() = addressee_id);

create policy "friendships: participants can delete" on friendships
  for delete using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

-- ── Weekly Scores ─────────────────────────────────────────────────────────────
create table if not exists weekly_scores (
  user_id        uuid not null references auth.users on delete cascade,
  week_start     date not null,
  display_name   text not null default '',
  battles_won    integer not null default 0,
  words_reviewed integer not null default 0,
  score          integer generated always as (battles_won * 10 + words_reviewed) stored,
  updated_at     timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table weekly_scores enable row level security;

create policy "weekly_scores: owner can write" on weekly_scores
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "weekly_scores: everyone can read" on weekly_scores
  for select using (true);
