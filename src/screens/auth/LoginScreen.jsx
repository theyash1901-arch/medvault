import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiShield, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function LoginScreen() {
  const { signIn, signInWithApple, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  };

  const handleAppleLogin = async () => {
    setError('');
    setLoading(true);
    const { error: authError } = await signInWithApple();
    if (authError) setError(authError.message);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error: authError } = await signInWithGoogle();
    if (authError) setError(authError.message);
    setLoading(false);
  };

  return (
    <div className="auth-page flex items-center justify-center min-h-screen p-5 bg-slate-50">
      <div className="auth-card bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-xl mb-4 text-2xl shadow-sm">
            <FiShield />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MedVault</h1>
          <p className="text-slate-500 mt-1">Your health records, secured.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="alert alert-error">
              <FiAlertCircle className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group mb-0">
            <label className="form-label">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                id="login-email"
                type="email"
                className="form-input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input pl-10 pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full py-3 mt-2 text-base"
            disabled={loading}
          >
            {loading ? <span className="spinner w-5 h-5 border-2"></span> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="px-3 text-xs font-medium text-slate-400 uppercase">OR</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn btn-outline w-full py-2.5 flex items-center justify-center gap-3 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-medium"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={loading}
              className="btn w-full py-2.5 flex items-center justify-center gap-3 bg-black text-white hover:bg-slate-800 font-medium"
            >
              <FaApple size={20} />
              Continue with Apple
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don't have an account? <Link to="/signup" className="font-semibold text-blue-600 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
