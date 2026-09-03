import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthPageProps {
  onSuccess: () => void;
  onNavigate: (page: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onNavigate }) => {
  const { login, register, switchDemoUser } = useAuth();
  const { success, error } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        success('Logged in successfully');
        onSuccess();
      } else {
        await register({ email, password, first_name: firstName, last_name: lastName, phone });
        success('Account created and verified');
        onSuccess();
      }
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#eaeded] min-h-screen py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center">
          <button onClick={() => onNavigate('home')} className="inline-block">
            <img
              src="https://i.ibb.co/nNS90SKj/pokecutweb-1788465862994.png"
              alt="SPINEL DISTRIBUTION"
              className="h-10 mx-auto object-contain mb-1"
            />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Sign in to Spinel Distribution' : 'Create an Enterprise Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Access order histories, live carrier tracking, and instant PDF invoicing
          </p>
        </div>

        {/* Demo Fast-Login Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>One-Click Interactive Demo Login</span>
          </div>
          <p className="text-amber-800 text-[11px]">
            Instant credentials pre-configured for evaluating RBAC permissions:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={async () => {
                await switchDemoUser('super_admin');
                success('Logged in as Super Admin');
                onSuccess();
              }}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded text-[10px] text-center shadow-xs transition-colors"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={async () => {
                await switchDemoUser('catalog_manager');
                success('Logged in as Catalog Manager');
                onSuccess();
              }}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded text-[10px] text-center shadow-xs transition-colors"
            >
              Catalog Mgr
            </button>
            <button
              type="button"
              onClick={async () => {
                await switchDemoUser('customer');
                success('Logged in as Customer');
                onSuccess();
              }}
              className="py-1.5 px-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded text-[10px] text-center shadow-xs transition-colors"
            >
              Customer
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="David"
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Mensah"
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 774 6353"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow hover:shadow-md transition-all active:scale-[0.99] mt-2"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                New to Spinel Distribution?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-amber-700 font-bold hover:underline"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-amber-700 font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
