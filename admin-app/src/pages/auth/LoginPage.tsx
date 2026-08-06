import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bus, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@abssai.com', password: 'password123' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animated-gradient">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
              <Bus size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ABSSAI</h1>
              <p className="text-xs text-indigo-300">Automated Bus Scheduling System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            AI-Powered Transit
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Management System
            </span>
          </h2>

          <p className="text-indigo-200 text-lg mb-8 max-w-md">
            Intelligent scheduling, real-time tracking, and predictive analytics
            for modern public transportation.
          </p>

          <div className="flex gap-6 text-sm">
            {[
              { label: 'Buses Managed', value: '500+' },
              { label: 'Daily Trips', value: '2,400+' },
              { label: 'Routes Covered', value: '180+' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-indigo-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8" style={{ background: 'rgba(17,17,24,0.8)', backdropFilter: 'blur(20px)' }}>
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
                <Bus size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">ABSSAI</span>
            </div>

            <h3 className="text-xl font-semibold text-white mb-1">Welcome back</h3>
            <p className="text-slate-400 text-sm mb-6">Sign in to your account to continue</p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input {...register('email')} type="email" className="input-field" placeholder="admin@abssai.com" />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Register</Link>
            </p>

            {/* Quick Login */}
            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-slate-500 mb-3">Quick Login (Demo)</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Admin', email: 'admin@abssai.com' },
                  { label: 'Scheduler', email: 'scheduler@abssai.com' },
                  { label: 'Driver', email: 'driver1@abssai.com' },
                ].map((demo) => (
                  <button key={demo.email} type="button"
                    onClick={() => { onSubmit({ email: demo.email, password: 'password123' }); }}
                    className="btn-secondary text-xs py-2 justify-center">
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
