import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirm, setConfirm] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome to Just Like Medium, ${res.data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch    = confirm.length > 0 && form.password === confirm;
  const passwordsMismatch = confirm.length > 0 && form.password !== confirm;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <div className="border-b border-medium-border dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-serif text-medium-black dark:text-gray-100">Just Like Medium</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-serif font-bold text-medium-black dark:text-gray-100 text-center mb-2">Join Just Like Medium.</h1>
          <p className="text-medium-gray dark:text-gray-400 text-sm text-center mb-8">Create an account to read, write, and connect.</p>

          <div className="border border-medium-border dark:border-gray-700 rounded-lg p-8 dark:bg-gray-800">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-medium-black dark:text-gray-200 mb-1.5">Full name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Your name" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-medium-black dark:text-gray-200 mb-1.5">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" required className="input-field" />
              </div>

              <div>
                <label className="block text-sm text-medium-black dark:text-gray-200 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} name="password" value={form.password}
                    onChange={handleChange} placeholder="At least 6 characters" required className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition"
                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-medium-black dark:text-gray-200 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)} placeholder="Re-enter your password" required
                    className={`input-field pr-10 ${
                      passwordsMismatch ? 'border-red-400 focus:border-red-400' :
                      passwordsMatch    ? 'border-green-500 focus:border-green-500' : ''
                    }`} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                    {showConfirm ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                  </button>
                </div>
                {passwordsMismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                {passwordsMatch    && <p className="text-xs text-green-600 mt-1">Passwords match</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full btn-black py-3 text-sm font-medium">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-medium-border dark:border-gray-700 text-center">
              <p className="text-sm text-medium-gray dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-medium-black dark:text-gray-200 hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          </div>

          <p className="text-xs text-medium-gray dark:text-gray-500 text-center mt-6 leading-relaxed">
            Click "Create account" to agree to Just Like Medium's{' '}
            <span className="underline cursor-pointer">Terms of Service</span>
            {' '}and acknowledge the{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
