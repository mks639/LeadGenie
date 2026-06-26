import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Search,
  Filter,
  ArrowUpDown,
  Mail,
  Eye,
  Link as LinkIcon,
  Calendar,
  X,
  RefreshCw,
  LogOut,
  Key,
  AlertCircle,
  Building,
  Phone,
  User,
  Sparkles,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';

export default function Dashboard({ navigate }) {
  // Authentication State (Bypassed for demo ease-of-use)
  const isLoggedIn = true;

  // Data States
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('submitted_at'); // 'submitted_at' | 'full_name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  
  // UI States
  const [copiedField, setCopiedField] = useState('');


  // Fetch leads from Supabase
  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchErr } = await supabase
        .from('leads')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (fetchErr) throw fetchErr;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Could not connect to database. Please check Supabase credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription and fetch initial data
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchLeads();

    // Subscribe to changes in leads table
    const subscription = supabase
      .channel('leads_live_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        console.log('Database change detected:', payload);
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isLoggedIn, sortField, sortOrder]);

  // Copy to clipboard helper
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Calculate Metrics
  const totalLeads = leads.length;
  const emailsSent = leads.filter(l => l.email_sent).length;
  const emailsOpened = leads.filter(l => l.email_opened).length;
  const linkClicks = leads.filter(l => l.link_clicked).length;
  
  const openRate = emailsSent > 0 ? ((emailsOpened / emailsSent) * 100).toFixed(1) : '0.0';
  const clickRate = emailsSent > 0 ? ((linkClicks / emailsSent) * 100).toFixed(1) : '0.0';

  // Filter Leads
  const filteredLeads = leads.filter(lead => {
    const searchString = `${lead.full_name} ${lead.email} ${lead.company || ''} ${lead.requirement}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'All' || lead.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Opened') matchesStatus = lead.email_opened;
    if (statusFilter === 'Clicked') matchesStatus = lead.link_clicked;
    if (statusFilter === 'Sent') matchesStatus = lead.email_sent && !lead.email_opened;
    if (statusFilter === 'Unsent') matchesStatus = !lead.email_sent;

    return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };



  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer animate-pulse-slow" onClick={() => navigate('/')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                LeadGenie <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-normal border border-purple-500/20">Admin</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchLeads}
              disabled={loading}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
              title="Refresh database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-all font-sans"
            >
              Landing Page
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 w-full space-y-8">
        
        {/* KPI Scorecard Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-5 rounded-2xl space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-bl-3xl pointer-events-none" />
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Leads</div>
            <div className="text-3xl font-extrabold text-white">{totalLeads}</div>
            <div className="text-[10px] text-gray-500">Submissions received</div>
          </div>
          
          <div className="glass-card p-5 rounded-2xl space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Emails Sent</div>
            <div className="text-3xl font-extrabold text-emerald-400">{emailsSent}</div>
            <div className="text-[10px] text-gray-500">Resend transmissions</div>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Emails Opened</div>
            <div className="text-3xl font-extrabold text-blue-400">{emailsOpened}</div>
            <div className="text-[10px] text-gray-500">Pixel telemetries</div>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Open Rate</div>
            <div className="text-3xl font-extrabold text-amber-400">{openRate}%</div>
            <div className="text-[10px] text-gray-500">Opened / Sent emails</div>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Link Clicks</div>
            <div className="text-3xl font-extrabold text-purple-400">{linkClicks}</div>
            <div className="text-[10px] text-gray-500">URL redirect hits</div>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-pink-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Click Rate</div>
            <div className="text-3xl font-extrabold text-pink-400">{clickRate}%</div>
            <div className="text-[10px] text-gray-500">Clicked / Sent emails</div>
          </div>
        </div>

        {/* Database connectivity error alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3 items-center">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-grow">{error}</div>
            <button onClick={fetchLeads} className="text-xs font-semibold underline hover:no-underline">Retry connection</button>
          </div>
        )}

        {/* Search, Filter & Controls Panel */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search leads by name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/5 bg-slate-900/50 text-sm glass-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters toggle */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* Priority Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Categories</option>
                  <option value="AI Automation">AI Automation</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="SaaS Product">SaaS Product</option>
                  <option value="Consulting / Strategy">Consulting / Strategy</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Telemetry:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Telemetries</option>
                  <option value="Sent">Sent (Only)</option>
                  <option value="Opened">Opened</option>
                  <option value="Clicked">Clicked</option>
                  <option value="Unsent">Failed / Unsent</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(priorityFilter !== 'All' || categoryFilter !== 'All' || statusFilter !== 'All' || searchTerm !== '') && (
                <button
                  onClick={() => {
                    setPriorityFilter('All');
                    setCategoryFilter('All');
                    setStatusFilter('All');
                    setSearchTerm('');
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lead Table Container */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-xs font-semibold text-gray-400 border-b border-white/5">
                  <th 
                    className="p-4 cursor-pointer hover:text-white transition-all select-none"
                    onClick={() => toggleSort('submitted_at')}
                  >
                    <div className="flex items-center gap-1.5">
                      Submitted At
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:text-white transition-all select-none"
                    onClick={() => toggleSort('full_name')}
                  >
                    <div className="flex items-center gap-1.5">
                      Lead Name
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">AI Category</th>
                  <th className="p-4">AI Priority</th>
                  <th className="p-4 text-center">Telemetry Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading && leads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-500">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-500" />
                      Loading database records...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-500">
                      No leads match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => {
                    const formattedDate = new Date(lead.submitted_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-white/[0.02] cursor-pointer group transition-all"
                        onClick={() => setSelectedLead(lead)}
                      >
                        {/* Date */}
                        <td className="p-4 text-xs text-gray-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-600" />
                            {formattedDate}
                          </div>
                        </td>

                        {/* Name & Company */}
                        <td className="p-4">
                          <div>
                            <div className="font-bold text-white">{lead.full_name}</div>
                            {lead.company ? (
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3" />
                                {lead.company}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-600 italic">No Company</div>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="p-4">
                          <div className="space-y-0.5 text-xs text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-gray-600" />
                              {lead.email}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-gray-600" />
                              {lead.phone}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="inline-flex text-[11px] font-semibold bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-gray-300">
                            {lead.category || 'Other'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="p-4">
                          <span className={`inline-flex text-[11px] font-bold rounded-full px-2.5 py-0.5 border ${
                            lead.priority === 'High' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : lead.priority === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {lead.priority || 'Medium'}
                          </span>
                        </td>

                        {/* Telemetry Statuses */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-4">
                            {/* Email Sent */}
                            <div 
                              className={`flex flex-col items-center gap-0.5 ${lead.email_sent ? 'text-green-400' : 'text-gray-600'}`}
                              title={lead.email_sent ? "Email Dispatched" : "Email Failed/Unsent"}
                            >
                              <Mail className="w-4 h-4" />
                              <span className="text-[9px] uppercase font-bold tracking-wider">Sent</span>
                            </div>

                            {/* Opened */}
                            <div 
                              className={`flex flex-col items-center gap-0.5 ${lead.email_opened ? 'text-blue-400 animate-pulse' : 'text-gray-600'}`}
                              title={lead.email_opened ? "Email Opened" : "Unopened"}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-[9px] uppercase font-bold tracking-wider">Open</span>
                            </div>

                            {/* Link Clicked */}
                            <div 
                              className={`flex flex-col items-center gap-0.5 ${lead.link_clicked ? 'text-purple-400 animate-bounce' : 'text-gray-600'}`}
                              title={lead.link_clicked ? "Link Clicked" : "Unclicked"}
                            >
                              <LinkIcon className="w-4 h-4" />
                              <span className="text-[9px] uppercase font-bold tracking-wider">Click</span>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-4 text-right">
                          <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Drawer Sidebar */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Overlay background */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedLead(null)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-xl bg-[#0e1322] border-l border-white/10 shadow-2xl h-full flex flex-col justify-between overflow-y-auto z-10 animate-slide-in">
            <div>
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Lead Details</h3>
                  <span className="text-xs text-gray-500 font-mono">ID: {selectedLead.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lead Information */}
              <div className="p-6 space-y-6">
                
                {/* Visual Workflow Tracking Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-purple-400 tracking-wider">Email Telemetry Timeline</h4>
                  <div className="relative pl-6 space-y-6 border-l-2 border-white/10 py-1">
                    
                    {/* Step 1: Submission */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-green-500 border-4 border-[#0e1322] shadow" />
                      <div className="text-sm font-semibold text-white">Lead Submission Recorded</div>
                      <div className="text-xs text-gray-500">Inserted into database on {new Date(selectedLead.submitted_at).toLocaleString()}</div>
                    </div>

                    {/* Step 2: AI Classification */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-purple-500 border-4 border-[#0e1322] shadow" />
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        AI Classification Complete
                        <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded-full">Gemini</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Category: <strong className="text-white">{selectedLead.category}</strong> &bull; Priority: 
                        <span className={`ml-1 inline-flex text-[10px] font-bold rounded-full px-1.5 py-0.1 border ${
                          selectedLead.priority === 'High' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : selectedLead.priority === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {selectedLead.priority}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Resend Dispatch */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-[#0e1322] shadow ${
                        selectedLead.email_sent ? 'bg-green-500' : 'bg-gray-700'
                      }`} />
                      <div className={`text-sm font-semibold ${selectedLead.email_sent ? 'text-white' : 'text-gray-500'}`}>
                        Transactional Email Sent
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedLead.email_sent ? 'Successfully dispatched via Resend' : 'Key missing or sandbox limit reached'}
                      </div>
                    </div>

                    {/* Step 4: Open Tracking */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-[#0e1322] shadow ${
                        selectedLead.email_opened ? 'bg-blue-500' : 'bg-gray-700'
                      }`} />
                      <div className={`text-sm font-semibold ${selectedLead.email_opened ? 'text-white' : 'text-gray-500'}`}>
                        Email Opened
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedLead.email_opened ? 'Open pixel telemetry received' : 'Awaiting user to open message'}
                      </div>
                    </div>

                    {/* Step 5: Click Tracking */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-[#0e1322] shadow ${
                        selectedLead.link_clicked ? 'bg-purple-500' : 'bg-gray-700'
                      }`} />
                      <div className={`text-sm font-semibold ${selectedLead.link_clicked ? 'text-white' : 'text-gray-500'}`}>
                        Destination Link Clicked
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedLead.link_clicked ? 'Redirect endpoint was hit' : 'Awaiting click event'}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Simulation Control Card (Only visible for demo testing) */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider font-sans">
                    <Sparkles className="w-3.5 h-3.5" /> Simulation Controls (Demo Mode)
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Since Resend Sandbox restricts email delivery to verified domains, use these buttons to trigger the email opens and link clicks telemetries instantly.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* Force Mark Sent */}
                    {!selectedLead.email_sent && (
                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from('leads')
                            .update({ email_sent: true })
                            .eq('id', selectedLead.id);
                          if (!error) {
                            setSelectedLead(prev => ({ ...prev, email_sent: true }));
                            fetchLeads();
                          }
                        }}
                        className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 font-semibold px-2.5 py-1.5 rounded-xl border border-green-500/20 transition-all font-sans"
                      >
                        Force Mark Sent
                      </button>
                    )}

                    {/* Simulate Open */}
                    {!selectedLead.email_opened && (
                      <button
                        onClick={async () => {
                          await fetch(`/api/track-open?lead_id=${selectedLead.id}`);
                          setSelectedLead(prev => ({ ...prev, email_opened: true }));
                          fetchLeads();
                        }}
                        className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold px-2.5 py-1.5 rounded-xl border border-blue-500/20 transition-all font-sans"
                      >
                        Simulate Email Open
                      </button>
                    )}

                    {/* Simulate Click */}
                    {!selectedLead.link_clicked && (
                      <button
                        onClick={async () => {
                          await fetch(`/api/track-click?lead_id=${selectedLead.id}&dest=${encodeURIComponent(window.location.origin)}`);
                          setSelectedLead(prev => ({ ...prev, link_clicked: true }));
                          fetchLeads();
                        }}
                        className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-semibold px-2.5 py-1.5 rounded-xl border border-purple-500/20 transition-all font-sans"
                      >
                        Simulate Link Click
                      </button>
                    )}
                  </div>
                </div>

                <hr className="border-white/5" />


                {/* Lead Profile */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase text-purple-400 tracking-wider">Contact Profile</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Lead Name</div>
                      <div className="text-sm font-bold text-white flex items-center justify-between">
                        {selectedLead.full_name}
                        <button 
                          onClick={() => copyToClipboard(selectedLead.full_name, 'name')}
                          className="text-gray-500 hover:text-white transition-all"
                        >
                          {copiedField === 'name' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Company</div>
                      <div className="text-sm font-bold text-white">
                        {selectedLead.company || <span className="text-gray-600 italic">None</span>}
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Email Address</div>
                      <div className="text-sm font-bold text-white flex items-center justify-between">
                        <span className="truncate max-w-[160px]">{selectedLead.email}</span>
                        <button 
                          onClick={() => copyToClipboard(selectedLead.email, 'email')}
                          className="text-gray-500 hover:text-white transition-all flex-shrink-0"
                        >
                          {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Phone Number</div>
                      <div className="text-sm font-bold text-white flex items-center justify-between">
                        {selectedLead.phone}
                        <button 
                          onClick={() => copyToClipboard(selectedLead.phone, 'phone')}
                          className="text-gray-500 hover:text-white transition-all"
                        >
                          {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* Submitted Requirement */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-purple-400 tracking-wider">Lead Requirement</h4>
                  <div className="p-4 bg-slate-950/80 border border-white/5 rounded-xl text-sm leading-relaxed text-gray-300 font-mono select-text whitespace-pre-wrap">
                    {selectedLead.requirement}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-slate-950/20 text-center">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all font-semibold text-sm"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-white/5 text-xs text-gray-500">
        &copy; {new Date().getFullYear()} LeadGenie Admin Panel. Live Real-Time database synchronization enabled.
      </footer>
    </div>
  );
}
