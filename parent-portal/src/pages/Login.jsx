import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
<<<<<<< HEAD
import { Shield, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
=======
import { Heart, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
>>>>>>> friend/main
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
<<<<<<< HEAD
      toast.success('Welcome back!', {
        className: 'dark:bg-[#1a1a1a] dark:text-white dark:border dark:border-[#333]',
      });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || error.message || 'Login failed', {
        className: 'dark:bg-[#1a1a1a] dark:text-white dark:border dark:border-[#333]',
      });
=======
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || error.message || 'Login failed');
>>>>>>> friend/main
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black dark:bg-white shadow-xl mb-6">
            <Shield className="w-8 h-8 text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">SafeRide</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-bold uppercase tracking-widest text-sm">Parent Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-[#111] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-[#222] p-8 sm:p-10 transition-all duration-300">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2 tracking-tight">Welcome back</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Sign in to track your children</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
=======
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">SafeRide</h1>
          <p className="text-gray-400 mt-2">Parent Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-6">Sign in to your parent account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> friend/main
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
<<<<<<< HEAD
                  placeholder="parent@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600"
=======
                  placeholder="parent@saferide.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
>>>>>>> friend/main
                  required
                />
              </div>
            </div>

            <div>
<<<<<<< HEAD
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
=======
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> friend/main
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
<<<<<<< HEAD
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600"
=======
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
>>>>>>> friend/main
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
<<<<<<< HEAD
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
=======
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
>>>>>>> friend/main
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
<<<<<<< HEAD
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-8 shadow-md"
=======
              className="w-full py-3 px-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
>>>>>>> friend/main
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

<<<<<<< HEAD
          <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-[#222]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-black dark:text-white font-bold hover:underline">
=======
          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-black font-semibold hover:text-gray-700">
>>>>>>> friend/main
                Register
              </Link>
            </p>
          </div>
        </div>
<<<<<<< HEAD
=======

        <p className="text-center text-gray-500 text-sm mt-6">
          Child Safety Tracking System
        </p>
>>>>>>> friend/main
      </div>
    </div>
  );
}
