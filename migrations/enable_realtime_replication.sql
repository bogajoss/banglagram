-- Enable Realtime for messages and profiles tables
-- This is CRITICAL for the chat features to work without refreshing
begin;
  -- Try to add tables to the default supabase_realtime publication
  -- usage: alter publication supabase_realtime add table <table_name>;
  
  -- Check if publication exists first (standard in Supabase)
  do $$
  begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end
  $$;

  -- Add messages table to realtime
  alter publication supabase_realtime add table messages;

  -- Add profiles table to realtime (for status updates)
  alter publication supabase_realtime add table profiles;

  -- Set replica identity to FULL to ensure we get all data in updates/deletes
  alter table messages replica identity full;
  alter table profiles replica identity full;
commit;
