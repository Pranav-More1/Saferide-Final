import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
<<<<<<< HEAD
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, User, Phone } from 'lucide-react';
=======
import { Heart, Mail, Lock, Eye, EyeOff, User, Phone, Loader2 } from 'lucide-react';
>>>>>>> friend/main
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match', { className: 'dark:bg-[#1a1a1a] dark:text-white' });
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters', { className: 'dark:bg-[#1a1a1a] dark:text-white' });
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter', { className: 'dark:bg-[#1a1a1a] dark:text-white' });
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      toast.error('Password must contain at least one lowercase letter', { className: 'dark:bg-[#1a1a1a] dark:text-white' });
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      toast.error('Password must contain at least one number', { className: 'dark:bg-[#1a1a1a] dark:text-white' });
=======
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
>>>>>>> friend/main
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
<<<<<<< HEAD
        role: 'parent',
      });
      toast.success('Account created successfully!', { className: 'dark:bg-[#1a1a1a] dark:text-white' });
      navigate('/');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.error || 'Registration failed', { className: 'dark:bg-[#1a1a1a] dark:text-white' });
=======
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || error.message || 'Registration failed');
>>>>>>> friend/main
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black dark:bg-white shadow-xl mb-6">
            <Shield className="w-8 h-8 text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">SafeRide</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-bold uppercase tracking-widest text-sm">Parent Portal</p>
        </div>

        {/* Register Form */}
        <div className="bg-white dark:bg-[#111] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-[#222] p-8 sm:p-10 transition-all duration-300">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2 tracking-tight">Create Account</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Register to track your children</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
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

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-500 mb-6">Register as a parent to track your children</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> friend/main
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
<<<<<<< HEAD
                  placeholder="Your full name"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600"
=======
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
>>>>>>> friend/main
                  required
                />
              </div>
            </div>

            <div>
<<<<<<< HEAD
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
=======
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> friend/main
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
=======
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> friend/main
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
<<<<<<< HEAD
                  placeholder="+91 98765-43210"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600"
=======
                  placeholder="+91 9876543210"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
>>>>>>> friend/main
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> friend/main
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
=======
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
>>>>>>> friend/main
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
<<<<<<< HEAD
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 pl-1">
                Min 8 chars, with uppercase, lowercase & number
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
=======
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> friend/main
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
<<<<<<< HEAD
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600"
=======
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
>>>>>>> friend/main
                  required
                />
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

<<<<<<< HEAD
          <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-[#222]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-black dark:text-white font-bold hover:underline">
=======
          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-semibold hover:text-gray-700">
>>>>>>> friend/main
                Sign In
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
