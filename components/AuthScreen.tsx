import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Mail, Lock, User, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'email' | 'verify' | 'details'>('email');
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { login, register, sendCode } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      alert(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const sentCode = await sendCode(email);
      setDemoCode(sentCode);
      setStep('verify');
    } catch (error: any) {
      alert('Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !username || !password) return;
    setLoading(true);
    try {
      await register(email, code, username, password);
    } catch (error: any) {
      alert(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-all">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">SocketDo</h1>
        <div className="flex justify-center mb-8 border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => { setIsLogin(true); setStep('email'); }}
            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${isLogin ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
          >
            Sign In
            {isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
          </button>
          <button 
             onClick={() => { setIsLogin(false); setStep('email'); }}
             className={`pb-2 px-4 text-sm font-medium transition-colors relative ${!isLogin ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
          >
            Sign Up
            {!isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
          </button>
        </div>

        {/* LOGIN FORM */}
        {isLogin && (
          <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* SIGNUP FLOW */}
        {!isLogin && (
          <div className="animate-in fade-in slide-in-from-left-4">
            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      className="w-full pl-10 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : <>Get Verify Code <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* Step 2: Verify Code */}
            {step === 'verify' && (
              <div className="space-y-4">
                 <div className="text-center text-sm text-slate-500 mb-4">
                    We sent a code to {email}.
                    {demoCode && (
                      <div className="mt-3 animate-in fade-in zoom-in">
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 px-3 py-1 rounded-md font-mono font-bold tracking-widest select-all">
                          {demoCode}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">(Simulation Mode)</div>
                      </div>
                    )}
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Verification Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        className="w-full pl-10 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white tracking-widest font-mono"
                        placeholder="123456"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                      />
                    </div>
                 </div>
                 <button
                    onClick={() => setStep('details')}
                    disabled={code.length < 6}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Verify & Continue <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => setStep('email')} className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-2">
                    Change Email
                  </button>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 'details' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        className="w-full pl-10 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                        placeholder="developer"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        required
                        className="w-full pl-10 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                 </div>
                 <div className="flex flex-col gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('verify')}
                        disabled={loading}
                        className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Verification
                    </button>
                 </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};