import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [foc, setFoc] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const ok = await login(email, password);
    if (ok) {
      navigate('/', { replace: true });
    } else {
      setError('Invalid email or password');
    }
  };


  return (
    <div
      className="min-h-screen bg-theme-bg flex items-center justify-center p-6 relative font-[Manrope] overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
      }}
    >
      <div className="w-full max-w-[420px] relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-executive-blue flex items-center justify-center shadow-lg shadow-executive-blue/20">
            <span className="material-symbols-outlined text-gray-900 dark:text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
          </div>
          <div className="text-center">
            <h1 className="text-gray-900 dark:text-white font-bold text-[28px] tracking-tight mb-1">Inventory OS</h1>
            <p className="text-gray-600 dark:text-gray-400 text-[14px]">Executive Management Portal</p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="glass-panel rounded-lg p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-widest uppercase">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFoc('email')}
                onBlur={() => setFoc(null)}
                className={`w-full p-3 rounded-lg text-[14px] outline-none transition-all duration-200 text-gray-900 dark:text-white ${foc === 'email' ? 'bg-white/60 dark:bg-black/60 border border-executive-blue ring-1 ring-executive-blue/20' : 'bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'}`}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-widest uppercase">Password</label>
                <a href="#" className="text-[11px] font-bold text-executive-blue hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFoc('pass')}
                  onBlur={() => setFoc(null)}
                  className={`w-full p-3 pr-11 rounded-lg text-[14px] outline-none transition-all duration-200 text-gray-900 dark:text-white ${foc === 'pass' ? 'bg-white/60 dark:bg-black/60 border border-executive-blue ring-1 ring-executive-blue/20' : 'bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'}`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[13px] font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-executive-blue hover:brightness-110 text-gray-900 dark:text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-executive-blue/20 active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 text-center font-[Manrope]">
            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-4">Demo Credentials</p>
            <div className="space-y-3 text-[13px]">
              {/* Admin info */}
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@gmail.com');
                  setPassword('admin123');
                  setError('');
                }}
                className="w-full p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col items-start gap-1.5 text-left hover:bg-black/10 dark:hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] uppercase font-bold text-executive-blue tracking-wide">Admin / Owner</span>
                  <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Click to Auto-fill</span>
                </div>
                <div className="flex justify-between w-full text-gray-700 dark:text-gray-300 mt-1">
                  <span>Email: <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">admin@gmail.com</code></span>
                  <span>Pass: <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">admin123</code></span>
                </div>
              </button>

              {/* Staff info */}
              <button
                type="button"
                onClick={() => {
                  setEmail('staff@company.com');
                  setPassword('password123');
                  setError('');
                }}
                className="w-full p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col items-start gap-1.5 text-left hover:bg-black/10 dark:hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wide">Staff</span>
                  <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Click to Auto-fill</span>
                </div>
                <div className="flex justify-between w-full text-gray-700 dark:text-gray-300 mt-1">
                  <span>Email: <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">staff@company.com</code></span>
                  <span>Pass: <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">password123</code></span>
                </div>
                
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}