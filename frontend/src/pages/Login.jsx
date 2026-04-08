import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-medium-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-serif text-medium-black">Just Like Medium</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-serif font-bold text-medium-black text-center mb-8">Welcome back.</h1>

          <div className="border border-medium-border rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-medium-black mb-1.5">Email</label>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com"
                  required className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-medium-black mb-1.5">Password</label>
                <input
                  type="password" name="password" value={form.password}
                  onChange={handleChange} placeholder="••••••••"
                  required className="input-field"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full btn-black py-3 text-sm font-medium">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-medium-border text-center">
              <p className="text-sm text-medium-gray">
                No account?{' '}
                <Link to="/register" className="text-medium-black hover:underline font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <p className="text-xs text-medium-gray text-center mt-6 leading-relaxed">
            Click "Sign in" to agree to Just Like Medium's{' '}
            <span className="underline cursor-pointer">Terms of Service</span>
            {' '}and acknowledge that Just Like Medium's{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>
            {' '}applies to you.
          </p>
        </div>
      </div>
    </div>
  );
}
