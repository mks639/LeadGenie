import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const resendApiKey = process.env.RESEND_API_KEY || '';
  const geminiApiKey = process.env.GEMINI_API_KEY || '';

  res.status(200).json({
    message: "Environment Variables Debug Info",
    viteSupabaseUrl: supabaseUrl ? `Present (Value: ${supabaseUrl})` : "Missing",
    supabaseServiceKey: supabaseServiceKey ? `Present (Length: ${supabaseServiceKey.length}, Starts with: ${supabaseServiceKey.substring(0, 10)}...)` : "Missing",
    resendApiKey: resendApiKey ? `Present (Length: ${resendApiKey.length}, Starts with: ${resendApiKey.substring(0, 5)}...)` : "Missing",
    geminiApiKey: geminiApiKey ? `Present (Length: ${geminiApiKey.length}, Starts with: ${geminiApiKey.substring(0, 5)}...)` : "Missing",
    files: {
      dotEnvExists: fs.existsSync('.env'),
      dotEnvLocalExists: fs.existsSync('.env.local')
    }
  });
}
