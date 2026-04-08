import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-medium-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-serif text-medium-black">Just Like Medium</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-serif font-bold text-medium-black text-center mb-2">Join Just Like Medium.</h1>
          <p className="text-medium-gray text-sm text-center mb-8">Create an account to read, write, and connect.</p>

          <div className="border border-medium-border rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-medium-black mb-1.5">Full name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Your name" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-medium-black mb-1.5">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-medium-black mb-1.5">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="At least 6 characters" required className="input-field" />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-black py-3 text-sm font-medium">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-medium-border text-center">
              <p className="text-sm text-medium-gray">
                Already have an account?{' '}
                <Link to="/login" className="text-medium-black hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          </div>

          <p className="text-xs text-medium-gray text-center mt-6 leading-relaxed">
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
