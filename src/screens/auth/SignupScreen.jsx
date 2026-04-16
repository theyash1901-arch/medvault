import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { data, error: authError } = await signUp(email, password);

    if (authError) {
      setError(authError.message);
    } else if (data?.user) {
      setSuccess('Account created! Please check your email to verify, then sign in.');
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg, #e6f2ff 0%, #ffffff 40%, #ffffff 60%, #e6f2ff 100%)' }}>
      <main className="w-full max-w-md flex flex-col items-center">
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#2563eb] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <svg fill="none" height="32" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">MedVault</h1>
          <p className="text-gray-600 text-base">Create your secure health account</p>
        </header>

        {/* Alerts */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {success}
          </div>
        )}

        {/* Form */}
        <form className="w-full" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="relative mb-6">
            <span className="absolute -top-2.5 left-9 bg-[#f7fbff] px-1 text-sm text-gray-500 z-10">Email</span>
            <div className="relative flex items-center bg-white/40 border border-gray-300 rounded-xl px-4 h-14">
              <span className="text-slate-400">
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <input
                id="signup-email"
                type="email"
                className="w-full bg-transparent border-none! outline-none! shadow-none! pl-3 text-gray-900 text-base placeholder:text-gray-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="relative mb-6">
            <span className="absolute -top-2.5 left-9 bg-[#f7fbff] px-1 text-sm text-gray-500 z-10">Password</span>
            <div className="relative flex items-center bg-white/40 border border-gray-300 rounded-xl px-4 h-14">
              <span className="text-slate-400">
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><rect height="11" rx="2" ry="2" width="18" x="3" y="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-transparent border-none! outline-none! shadow-none! pl-3 text-gray-900 text-base placeholder:text-gray-400"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#007aff] ml-2 opacity-80 hover:opacity-100">
                {showPassword ? (
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="relative mb-6">
            <span className="absolute -top-2.5 left-9 bg-[#f7fbff] px-1 text-sm text-gray-500 z-10">Confirm Password</span>
            <div className="relative flex items-center bg-white/40 border border-gray-300 rounded-xl px-4 h-14">
              <span className="text-slate-400">
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><rect height="11" rx="2" ry="2" width="18" x="3" y="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                id="signup-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                className="w-full bg-transparent border-none! outline-none! shadow-none! pl-3 text-gray-900 text-base placeholder:text-gray-400"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-[#007aff] ml-2 opacity-80 hover:opacity-100">
                {showConfirm ? (
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mb-8 text-slate-700 text-xs">
            <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
            <span>Your data is encrypted end-to-end</span>
          </div>

          {/* Submit */}
          <button
            id="signup-submit"
            type="submit"
            className="w-full bg-[#007aff] hover:bg-[#0066d6] text-white font-extrabold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] text-lg disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-slate-600 mb-6">
            Already have an account? <Link to="/login" className="text-[#007aff] font-bold hover:underline">Sign in</Link>
          </p>
          <p className="text-slate-500 text-xs leading-relaxed px-4">
            By creating an account, you agree to our<br />
            <span className="font-medium underline decoration-1 underline-offset-2">Privacy Policy</span> and <span className="font-medium underline decoration-1 underline-offset-2">Terms of Service</span>.
          </p>
        </footer>
      </main>
    </div>
  );
}
