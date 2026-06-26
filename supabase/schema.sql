-- Create leads table in Supabase
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  requirement TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  email_opened BOOLEAN DEFAULT false,
  link_clicked BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'Other',
  priority TEXT DEFAULT 'Medium'
);

-- Enable Row Level Security (optional, depending on access patterns)
-- For simplicity, if database access is through anon-key or service role:
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- If you enable RLS, you can add policies like:
-- CREATE POLICY "Allow anonymous insert" ON leads FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow read access for admin dashboard" ON leads FOR SELECT USING (true);
