import React, { useState } from 'react';
import { 
  Activity, Play, CheckCircle2, XCircle, Clock, ShieldCheck, 
  RefreshCw, AlertTriangle, ArrowLeft, Terminal 
} from 'lucide-react';
import { api } from '../services/api';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  message?: string;
}

interface TestData {
  summary: {
    total: number;
    passed: number;
    failed: number;
    allPassed: boolean;
  };
  results: TestResult[];
  totalDurationMs: number;
}

export const AutomatedTestsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [running, setRunning] = useState<boolean>(false);
  const [data, setData] = useState<TestData | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<string>('all');

  const runAllTests = async () => {
    setRunning(true);
    const start = Date.now();
    try {
      const res = await api.runAllTests();
      setData({
        summary: res.summary,
        results: res.results,
        totalDurationMs: Date.now() - start
      });
    } catch (err: unknown) {
      console.error('Failed to run test suite:', err);
    } finally {
      setRunning(false);
    }
  };

  const getFilteredResults = () => {
    if (!data) return [];
    if (selectedSuite === 'all') return data.results;
    return data.results.filter(r => r.suite.toLowerCase().includes(selectedSuite.toLowerCase()));
  };

  // Group by suite
  const groupedResults = getFilteredResults().reduce((acc, r) => {
    if (!acc[r.suite]) acc[r.suite] = [];
    acc[r.suite].push(r);
    return acc;
  }, {} as Record<string, TestResult[]>);

  return (
    <div className="bg-[#0b1120] min-h-screen text-slate-100 p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-400/10 text-amber-400 rounded-lg">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Automated QA & Architectural Verification</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live end-to-end integration test runner validating Auth, RBAC, RLS, Price tampering, Paystack, and Imports
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={runAllTests}
            disabled={running}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>{running ? 'Executing Test Suites Live...' : 'Run All Verification Suites'}</span>
          </button>
        </div>

        {/* Results Banner */}
        {data ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Assertions</span>
              <span className="text-2xl font-black text-white font-mono">{data.summary.total}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Passed Tests</span>
              <span className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                {data.summary.passed}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Failed Tests</span>
              <span className={`text-2xl font-black font-mono flex items-center gap-1.5 ${
                data.summary.failed > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {data.summary.failed > 0 ? <XCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                {data.summary.failed}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Execution Time</span>
              <span className="text-2xl font-black text-amber-400 font-mono flex items-center gap-1.5">
                <Clock className="w-5 h-5" />
                {data.totalDurationMs}ms
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
            <Terminal className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">System Verification Suite Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the button above to trigger full verification against our Express backend and in-memory store. 
              Tests will execute real HTTP requests verifying security boundaries and data isolation.
            </p>
            <button
              onClick={runAllTests}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow"
            >
              Start Full Execution
            </button>
          </div>
        )}

        {/* Filter Suite Tabs */}
        {data && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: 'all', label: 'All Suites' },
                { id: 'auth', label: '1. Auth & Sessions' },
                { id: 'rbac', label: '2. RBAC Permissions' },
                { id: 'rls', label: '3. Data Isolation' },
                { id: 'pricing', label: '4. Server Pricing' },
                { id: 'paystack', label: '5. Paystack Idempotency' },
                { id: 'import', label: '6. High-Volume Import' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSuite(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    selectedSuite === tab.id
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Test Results Breakdown Grouped by Suite */}
            <div className="space-y-4">
              {(Object.entries(groupedResults) as [string, TestResult[]][]).map(([suiteName, tests]) => (
                <div key={suiteName} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between font-bold text-white">
                    <span className="uppercase tracking-wider font-mono text-amber-400">
                      SUITE: {suiteName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {tests.filter((t) => t.passed).length} / {tests.length} passed
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {tests.map((t, idx) => (
                      <div key={idx} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-start gap-3">
                          {t.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold text-white">{t.name}</div>
                            {t.message && (
                              <div className={`text-[11px] mt-1 font-mono p-1.5 rounded ${
                                t.passed ? 'text-slate-400' : 'text-rose-400 bg-rose-500/10'
                              }`}>
                                {t.message}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            t.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {t.passed ? 'PASSED' : 'FAILED'}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            {t.durationMs}ms
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
