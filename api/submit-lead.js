import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { full_name, email, phone, company, requirement } = req.body;

    if (!full_name || !email || !phone || !requirement) {
      return res.status(400).json({ error: 'Missing required fields: full_name, email, phone, and requirement are required.' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase configuration is missing on the server.' });
    }

    // 1. Perform AI Classification using Gemini
    let category = 'Other';
    let priority = 'Medium';
    let aiUsed = false;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `You are an AI lead classification system. Analyze the following lead requirement and classify it.
Requirement: "${requirement}"

Your response must be a JSON object with exactly two keys: "category" and "priority".
Choose the most relevant "category" from: "AI Automation", "Web Development", "Mobile App", "SaaS Product", "Consulting / Strategy", "Digital Marketing", "Other".
Choose the "priority" from: "High", "Medium", "Low" based on the urgency, size, or business value implied by the requirement. Example: "I need an AI chatbot" -> {"category": "AI Automation", "priority": "High"}.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (parsed.category) category = parsed.category;
        if (parsed.priority) priority = parsed.priority;
        aiUsed = true;
      } catch (aiError) {
        console.error('Gemini AI Classification failed, using fallback:', aiError);
      }
    }

    // Rule-based Fallback Classification if Gemini fails or is not configured
    if (!aiUsed) {
      const reqLower = requirement.toLowerCase();
      if (reqLower.includes('ai') || reqLower.includes('bot') || reqLower.includes('chatbot') || reqLower.includes('gpt') || reqLower.includes('llm') || reqLower.includes('openai') || reqLower.includes('automation')) {
        category = 'AI Automation';
        priority = 'High';
      } else if (reqLower.includes('web') || reqLower.includes('site') || reqLower.includes('react') || reqLower.includes('nextjs') || reqLower.includes('portal')) {
        category = 'Web Development';
        priority = 'Medium';
      } else if (reqLower.includes('mobile') || reqLower.includes('app') || reqLower.includes('android') || reqLower.includes('ios')) {
        category = 'Mobile App';
        priority = 'High';
      } else if (reqLower.includes('saas') || reqLower.includes('software') || reqLower.includes('product')) {
        category = 'SaaS Product';
        priority = 'High';
      } else if (reqLower.includes('consulting') || reqLower.includes('strategy') || reqLower.includes('advice') || reqLower.includes('help')) {
        category = 'Consulting / Strategy';
        priority = 'Medium';
      } else if (reqLower.includes('marketing') || reqLower.includes('seo') || reqLower.includes('ads') || reqLower.includes('social')) {
        category = 'Digital Marketing';
        priority = 'Low';
      }
    }

    // 2. Insert Lead into Supabase
    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([
        {
          full_name,
          email,
          phone,
          company: company || null,
          requirement,
          category,
          priority,
          email_sent: false,
          email_opened: false,
          link_clicked: false
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insertion failed:', insertError);
      return res.status(500).json({ error: `Database insertion failed: ${insertError.message}` });
    }

    const leadId = insertedLead.id;

    // 3. Send Email using Resend
    let emailSent = false;
    let emailErrorLog = null;

    if (resend) {
      try {
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['host'];
        const origin = `${protocol}://${host}`;

        // Create tracking pixel and CTA tracking links
        const trackingPixelUrl = `${origin}/api/track-open?lead_id=${leadId}`;
        const redirectDestination = `${origin}?ref=email-cta`; // Redirect back to landing page
        const trackingCtaUrl = `${origin}/api/track-click?lead_id=${leadId}&dest=${encodeURIComponent(redirectDestination)}`;

        const emailSubject = `We received your request, ${full_name}!`;
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Thank You</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  background-color: #f9fafb;
                  color: #1f2937;
                  padding: 24px;
                  margin: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: #ffffff;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 32px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .header {
                  margin-bottom: 24px;
                }
                .title {
                  font-size: 20px;
                  font-weight: 700;
                  color: #7c3aed;
                }
                .content {
                  font-size: 16px;
                  line-height: 1.6;
                  color: #374151;
                }
                .quote-box {
                  background-color: #f3f4f6;
                  border-left: 4px solid #7c3aed;
                  padding: 16px;
                  margin: 20px 0;
                  border-radius: 4px;
                  font-style: italic;
                  color: #4b5563;
                }
                .btn-container {
                  margin: 28px 0;
                  text-align: center;
                }
                .btn {
                  display: inline-block;
                  background-color: #7c3aed;
                  color: #ffffff !important;
                  padding: 12px 24px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: 600;
                  box-shadow: 0 4px 6px rgba(124, 58, 237, 0.2);
                }
                .footer {
                  margin-top: 32px;
                  padding-top: 16px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 14px;
                  color: #6b7280;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="title">LeadGenie Team</div>
                </div>
                <div class="content">
                  <p>Hi <strong>${full_name}</strong>,</p>
                  <p>Thank you for contacting us. We have received your request and our team will get back to you shortly.</p>
                  <p>Here is a summary of the requirement you submitted:</p>
                  <div class="quote-box">
                    "${requirement}"
                  </div>
                  <p>Click the button below to learn more about our automated products and custom solutions:</p>
                  <div class="btn-container">
                    <a href="${trackingCtaUrl}" class="btn">Explore Custom Solutions</a>
                  </div>
                  <p>Regards,<br><strong>LeadGenie Team</strong></p>
                </div>
                <div class="footer">
                  This is an automated notification. If you did not make this request, please ignore this email.
                </div>
              </div>
              <!-- Open tracking pixel -->
              <img src="${trackingPixelUrl}" width="1" height="1" style="display: none;" alt="" />
            </body>
          </html>
        `;

        // Send the email. Note: Sandbox Resend accounts can only send to their verified email addresses.
        // We will default to sending to the lead's email, but catch the error if they are in sandbox mode.
        const sendResult = await resend.emails.send({
          from: 'LeadGenie <onboarding@resend.dev>',
          to: [email],
          subject: emailSubject,
          html: emailHtml,
        });

        if (sendResult.error) {
          throw new Error(sendResult.error.message || 'Resend error occurred.');
        }

        emailSent = true;
      } catch (err) {
        console.error('Email sending failed:', err.message);
        emailErrorLog = err.message;
      }
    } else {
      console.warn('Resend key is missing, skipping email send.');
      emailErrorLog = 'Resend API key is not configured.';
    }

    // 4. Update Email Sent status in Supabase if successful
    if (emailSent) {
      await supabase
        .from('leads')
        .update({ email_sent: true })
        .eq('id', leadId);
      
      insertedLead.email_sent = true;
    }

    return res.status(200).json({
      success: true,
      lead: {
        ...insertedLead,
        email_sent: emailSent
      },
      email_status: emailSent ? 'Sent successfully' : 'Not sent',
      email_error: emailErrorLog,
      ai_classification: {
        category,
        priority,
        used: aiUsed
      }
    });

  } catch (error) {
    console.error('Error handling lead submission:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
