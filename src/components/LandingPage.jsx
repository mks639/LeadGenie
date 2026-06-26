import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Building, 
  Phone, 
  Mail, 
  User, 
  Loader2,
  Lock
} from 'lucide-react';

export default function LandingPage({ navigate }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    requirement: ''
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Real-time Validation
  const validateField = (name, value) => {
    let error = '';
    if (name === 'fullName') {
      if (!value.trim()) error = 'Full name is required';
      else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) error = 'Email address is required';
      else if (!emailRegex.test(value)) error = 'Please enter a valid email address';
    }
    if (name === 'phone') {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Simple international format validation
      if (!value.trim()) error = 'Phone number is required';
      else if (value.replace(/\D/g, '').length < 7) error = 'Phone number is too short';
    }
    if (name === 'requirement') {
      if (!value.trim()) error = 'Requirement details are required';
      else if (value.trim().length < 10) error = 'Please describe your requirement in at least 10 characters';
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) element.focus();
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          requirement: formData.requirement
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setStatus('success');
      
      // Fire Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#a78bfa', '#ec4899', '#3b82f6']
      });

    } catch (err) {
      console.error('Submission error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during submission. Please try again.');
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      requirement: ''
    });
    setStatus('idle');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px] animate-pulse-slow-reverse pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-sans">
            LeadGenie
          </span>
        </div>
        
        <button 
          onClick={() => navigate('/admin')} 
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold glass-card text-gray-300 hover:text-white border border-white/10 hover:border-purple-500/30 transition-all duration-200"
        >
          <Lock className="w-3.5 h-3.5" />
          Admin Portal
        </button>
      </header>

      {/* Hero & Main Form Area */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto px-6 py-12 lg:py-20 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: SaaS Taglines */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3 h-3" />
            AI-Powered Lead Engagement
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent font-sans">
            Engage leads instantly. <br />
            Track results <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">automatically.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0">
            Submit your business requirements to receive a personalized engagement proposal. Our platform automatically analyzes your request, classifies your priority, and sends an interactive package with live engagement tracking.
          </p>
          
          {/* Statistics widgets */}
          <div className="grid grid-cols-3 gap-6 pt-6 max-w-md mx-auto lg:mx-0">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">Instant</div>
              <div className="text-xs text-gray-500">Auto-Responder</div>
            </div>
            <div className="space-y-1 border-x border-white/10 px-6">
              <div className="text-2xl font-bold text-white">Gemini</div>
              <div className="text-xs text-gray-500">AI Priority Match</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-gray-500">Live Tracking</div>
            </div>
          </div>
        </div>

        {/* Right Side: Lead Capture Form Card */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="w-full max-w-xl glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
            
            {status !== 'success' ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Request Information</h2>
                  <p className="text-sm text-gray-400">Fill out this quick form and experience our automated tracking workflow firsthand.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
                        <User className="w-4 h-4" />
                      </span>
                      <input 
                        type="text" 
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="John Doe"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border glass-input transition-all ${
                          errors.fullName ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10'
                        }`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}</p>
                    )}
                  </div>

                  {/* Email & Phone fields in grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Email Address</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="john@company.com"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border glass-input transition-all ${
                            errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10'
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Phone Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input 
                          type="tel" 
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="+1 (555) 000-0000"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border glass-input transition-all ${
                            errors.phone ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10'
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Company Field (Optional) */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Company Name <span className="text-gray-600">(optional)</span></label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
                        <Building className="w-4 h-4" />
                      </span>
                      <input 
                        type="text" 
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Acme Corp"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 glass-input transition-all"
                      />
                    </div>
                  </div>

                  {/* Requirement field */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Requirement / Message</label>
                    <textarea 
                      name="requirement"
                      value={formData.requirement}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows="3"
                      placeholder="E.g., I need a custom AI chatbot built for customer support integration, with high throughput requirements..."
                      className={`w-full px-4 py-3 rounded-xl border glass-input transition-all resize-none ${
                        errors.requirement ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10'
                      }`}
                    />
                    {errors.requirement ? (
                      <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.requirement}</p>
                    ) : (
                      <span className="text-[10px] text-gray-500 block text-right">Minimum 10 characters for AI priority analyzer</span>
                    )}
                  </div>

                  {status === 'error' && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2 items-start">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>{errorMessage}</div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === 'submitting'}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Lead...
                      </>
                    ) : (
                      <>
                        Submit & Request Auto-Proposal
                        <Send className="w-4 h-4 ml-0.5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              // Success Screen
              <div className="py-12 px-4 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto shadow-xl shadow-green-500/5 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-white">Thank You!</h2>
                  <p className="text-gray-300 text-base max-w-sm mx-auto">
                    Your request has been submitted successfully.
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-400 text-left max-w-sm mx-auto space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Next Steps:
                  </div>
                  <p>1. Check your email inbox shortly for a personalized confirmation.</p>
                  <p>2. Open the email to test the real-time open status updater.</p>
                  <p>3. Click the exploration link in the email to trigger redirect tracking.</p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button 
                    onClick={handleReset} 
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
                  >
                    Submit Another Request
                  </button>
                  <button 
                    onClick={() => navigate('/admin')} 
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all text-sm font-semibold flex items-center justify-center gap-1.5"
                  >
                    View Admin Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Feature Cards Grid (Bottom) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12 w-full border-t border-white/5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-400 text-center mb-8">System Capabilities</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-white">AI Classification</h4>
            <p className="text-sm text-gray-400">Requirements are analyzed by Gemini AI to classify leads into business categories and priorities in real-time.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Personalized Emails</h4>
            <p className="text-sm text-gray-400">Instantly triggers customized transactional emails containing dynamic lead criteria using the Resend API.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Telemetry & Tracking</h4>
            <p className="text-sm text-gray-400">Silent pixel open detection and click redirects instantly update lead status parameters on the dashboard.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-6 border-t border-white/5 text-xs text-gray-500">
        &copy; {new Date().getFullYear()} LeadGenie System. All rights reserved. Deployed via Vercel.
      </footer>
    </div>
  );
}
