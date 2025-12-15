import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import {
  Upload,
  BarChart3,
  TrendingUp,
  Package,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  LogOut,

  PieChart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface AnalysisSummary {
  total_orders?: number;
  total_revenue?: number;
  total_items_sold?: number;
}

interface AnalysisData {
  summary?: AnalysisSummary;
  insights?: string[];
  recommendations?: string[];
  sales_trend?: { name: string; value: number }[];
  category_breakdown?: { name: string; value: number }[];
}

interface AnalysisResponse {
  report_id: string;
  status: string;
  column_mapping?: Record<string, string | null>;
  analysis?: AnalysisData;
  filename?: string;
  created_at: string;
}

export default function EcommerceAnalyzer() {
  const [session, setSession] = useState<Session | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAnalysis(null);
    setFile(null);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (selectedFile: File) => {
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = selectedFile.name
      .substring(selectedFile.name.lastIndexOf('.'))
      .toLowerCase();

    if (!validTypes.includes(fileExt)) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const pollReport = async (reportId: string) => {
    const interval = setInterval(async () => {
      try {
        if (!session?.access_token) return;
        const res = await fetch(`${API_BASE_URL}/api/report/${reportId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch report status');

        const data: AnalysisResponse = await res.json();
        if (data.status === 'completed') {
          setAnalysis(data);
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setError('Report generation failed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);
  };

  const handleAnalyze = async () => {
    if (!session) {
      setError('Please sign in first');
      return;
    }

    if (!file) {
      setError('Please upload a file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Analysis failed');
      }

      const data: AnalysisResponse = await res.json();
      if (data.status === 'preprocessing') {
        pollReport(data.report_id);
      } else {
        setAnalysis(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error analyzing file');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setFile(null);
    setError('');
  };

  const formatCurrency = (amount?: number) =>
    amount !== undefined
      ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
      : 'N/A';

  // ------------------ RENDER ------------------

  if (analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analysis Complete</h1>
              <p className="text-purple-200">File: {analysis.filename || file?.name}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                New Analysis
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">
                  {analysis.analysis?.summary?.total_orders?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <p className="text-purple-200 text-sm">Total Orders</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(analysis.analysis?.summary?.total_revenue)}
                </span>
              </div>
              <p className="text-purple-200 text-sm">Total Revenue</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">
                  {analysis.analysis?.summary?.total_items_sold?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <p className="text-purple-200 text-sm">Items Sold</p>
            </div>
          </div>

          {/* Insights & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Key Insights</h2>
              </div>
              <ul className="space-y-3">
                {analysis.analysis?.insights?.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-100">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Recommendations</h2>
              </div>
              <ul className="space-y-3">
                {analysis.analysis?.recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-200">{idx + 1}</span>
                    </div>
                    <span className="text-purple-100">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>



          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Trend Chart */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Sales Trend (Last 30 Days)</h2>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analysis.analysis?.sales_trend || []}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke="#cbd5e1" fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Chart */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <PieChart className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Top Categories</h2>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.analysis?.category_breakdown || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis type="number" stroke="#cbd5e1" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                    <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={12} width={100} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {(analysis.analysis?.category_breakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Insights & Recommendations */}
          {analysis.column_mapping && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Column Mapping</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(analysis.column_mapping).map(([key, val]) =>
                  val ? (
                    <div
                      key={key}
                      className="bg-green-50 p-2 rounded flex items-center gap-2"
                    >
                      <span className="text-sm text-gray-600">{key}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-800">{val}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      </div >
    );
  }

  // ------------------ Upload UI ------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Auth Check */}
        {!session ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center max-w-lg w-full">
              <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-purple-600/30">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Welcome to AFBR</h1>
              <p className="text-purple-200 text-lg mb-8">
                Sign in to securely upload and analyze your business data using AI.
              </p>
              <button
                onClick={handleLogin}
                className="w-full px-8 py-4 bg-white text-purple-900 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header with Logout */}
            <div className="flex justify-end mb-4">
              <button onClick={handleLogout} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>

            {/* Upload Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">

              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive ? 'border-purple-400 bg-purple-500/20' : 'border-white/30 bg-white/5'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="fileInput"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileChange(e.target.files![0])}
                  className="hidden"
                />
                {!file ? (
                  <div>
                    <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <p className="text-white text-lg font-medium mb-2">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-purple-300 text-sm mb-4">
                      CSV or Excel files (max 20MB, 100K rows)
                    </p>
                    <label
                      htmlFor="fileInput"
                      className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      Select File
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-purple-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-purple-300 text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading || !file}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Your Data...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5" />
                    Analyze Data
                  </>
                )}
              </button>

              <p className="text-center text-purple-300 text-xs mt-4">
                Limit: 1 analysis per day per user
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
