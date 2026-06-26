import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export default async function handler(req, res) {
  const { lead_id, dest } = req.query;

  // Set default redirect URL in case dest is missing
  let redirectUrl = dest || '/';

  // Ensure redirect URL is absolute or valid root relative path
  if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://') && !redirectUrl.startsWith('/')) {
    redirectUrl = '/' + redirectUrl;
  }

  if (!lead_id) {
    console.warn('Track Click: Missing lead_id parameter.');
    return res.redirect(302, redirectUrl);
  }

  if (!supabase) {
    console.error('Track Click: Supabase service key is missing.');
    return res.redirect(302, redirectUrl);
  }

  try {
    // Update lead in Supabase
    const { error } = await supabase
      .from('leads')
      .update({ link_clicked: true })
      .eq('id', lead_id);

    if (error) {
      console.error('Track Click: Supabase update failed:', error.message);
    } else {
      console.log(`Track Click: Lead ${lead_id} marked as link_clicked.`);
    }
  } catch (err) {
    console.error('Track Click: Unexpected error:', err.message);
  }

  // Redirect user to destination website
  return res.redirect(302, redirectUrl);
}
