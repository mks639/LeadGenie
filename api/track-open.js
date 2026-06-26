import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export default async function handler(req, res) {
  const { lead_id } = req.query;

  // A transparent 1x1 GIF
  const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const gifBuffer = Buffer.from(gifBase64, 'base64');

  // Disable caching so the request always hits our server on open
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', gifBuffer.length);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (!lead_id) {
    console.error('Track Open: Missing lead_id parameter.');
    return res.status(200).send(gifBuffer);
  }

  if (!supabase) {
    console.error('Track Open: Supabase service key is missing.');
    return res.status(200).send(gifBuffer);
  }

  try {
    // Update lead in Supabase
    const { error } = await supabase
      .from('leads')
      .update({ email_opened: true })
      .eq('id', lead_id);

    if (error) {
      console.error('Track Open: Supabase update failed:', error.message);
    } else {
      console.log(`Track Open: Lead ${lead_id} marked as email_opened.`);
    }
  } catch (err) {
    console.error('Track Open: Unexpected error:', err.message);
  }

  // Always return the transparent GIF, even if database update fails, to prevent visual breakage in email client
  return res.status(200).send(gifBuffer);
}
