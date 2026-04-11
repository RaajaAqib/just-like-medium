import { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { FiAlertCircle, FiCheckCircle, FiXCircle, FiClock, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const ACTION_REASONS = [
  { id: 'warn',    label: 'Warning' },
  { id: 'suspend', label: 'Suspension' },
  { id: 'ban',     label: 'Ban' },
  { id: 'delete',  label: 'Comment deletion' },
];

const STATUS_META = {
  pending:  { icon: FiClock,       color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20  border-amber-200 dark:border-amber-800',  label: 'Under review' },
  approved: { icon: FiCheckCircle, color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20  border-green-200 dark:border-green-800',  label: 'Approved — action reversed' },
  rejected: { icon: FiXCircle,     color: 'text-red-600   dark:text-red-400',    bg: 'bg-red-50   dark:bg-red-900/20    border-red-200   dark:border-red-800',    label: 'Rejected' },
};

export default function AppealPage() {
  const { user } = useAuth();
  const [appeals, setAppeals]         = useState([]);
  const [loadingAppeals, setLoadingA] = useState(true);
  const [action, setAction]           = useState('warn');
  const [commentContent, setCC]       = useState('');
  const [reason, setReason]           = useState('');
  const [submitting, setSub]          = useState(false);
  const [showForm, setShowForm]       = useState(false);

  useEffect(() => {
    api.get('/appeals/my')
      .then(r => setAppeals(r.data.appeals || []))
      .catch(() => toast.error('Failed to load appeals'))
      .finally(() => setLoadingA(false));
  }, []);

  const submitAppeal = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || !reason.trim()) return toast.error('All fields required');
    setSub(true);
    try {
      const res = await api.post('/appeals', { action, commentContent: commentContent.trim(), reason: reason.trim() });
      setAppeals(prev => [res.data.appeal, ...prev]);
      setShowForm(false); setCC(''); setReason('');
      toast.success('Appeal submitted — our team will review it');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit appeal'); }
    finally { setSub(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FiShield className="text-2xl text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Moderation Appeals</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          If you believe a moderation action taken against one of your comments was incorrect,
          you can submit an appeal here. Our team reviews all appeals within 3–5 business days.
        </p>
      </div>

      {(user?.banned || user?.isSuspended) && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
            {user.banned ? 'Your account has been banned' : 'Your account is suspended'}
          </p>
          <p className="text-xs text-red-500 dark:text-red-400">
            {user.banned
              ? 'You cannot post comments. Submit an appeal below if you believe this was a mistake.'
              : `Suspended until ${user.suspendedUntil ? format(new Date(user.suspendedUntil), 'PPP') : '—'}. Submit an appeal if you believe this was incorrect.`}
          </p>
        </div>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="mb-8 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-full hover:bg-gray-700 dark:hover:bg-white transition">
          + Submit a new appeal
        </button>
      ) : (
        <form onSubmit={submitAppeal}
          className="mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">New appeal</h2>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Which action are you appealing?</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_REASONS.map(a => (
                <label key={a.id}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                    action === a.id ? 'border-gray-800 dark:border-gray-300 bg-gray-50 dark:bg-gray-700' : 'border-gray-100 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                  <input type="radio" name="action" value={a.id} checked={action === a.id}
                    onChange={() => setAction(a.id)} className="accent-gray-900 dark:accent-gray-100" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Paste the comment that was actioned</label>
            <textarea value={commentContent} onChange={e => setCC(e.target.value)} rows={3} maxLength={1000}
              placeholder="Copy and paste the exact content of the comment that was removed or penalised…"
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors" />
            <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">{commentContent.length} / 1000</p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Why do you believe this action was incorrect?</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} maxLength={500}
              placeholder="Explain clearly why you think this decision should be reconsidered…"
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors" />
            <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">{reason.length} / 500</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-4 py-3 mb-5">
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
              Appeals are reviewed by our moderation team. Submitting false or repeated appeals may result in additional restrictions.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition">Cancel</button>
            <button type="submit" disabled={submitting || !commentContent.trim() || !reason.trim()}
              className="px-5 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:bg-gray-700 dark:hover:bg-white transition disabled:opacity-40">
              {submitting ? 'Submitting…' : 'Submit appeal'}
            </button>
          </div>
        </form>
      )}

      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">My appeals</h2>

      {loadingAppeals ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
      ) : appeals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <FiAlertCircle className="text-3xl mx-auto mb-3 opacity-40" />
          <p className="text-sm">You haven't submitted any appeals yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map(a => {
            const meta = STATUS_META[a.status] || STATUS_META.pending;
            const Icon = meta.icon;
            return (
              <div key={a._id} className={`rounded-xl border p-4 ${meta.bg}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`text-base ${meta.color}`} />
                    <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <span className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                      {ACTION_REASONS.find(x => x.id === a.action)?.label || a.action}
                    </span>
                    <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg px-3 py-2 mb-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">Your comment</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{a.commentContent}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1"><span className="font-medium">Your reason:</span> {a.reason}</p>
                {a.adminNote && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    <span className="font-medium">Admin note:</span> {a.adminNote}
                  </p>
                )}
                {a.reviewedBy && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Reviewed by <span className="font-medium">{a.reviewedBy.name}</span>
                    {a.reviewedAt && ` · ${format(new Date(a.reviewedAt), 'PPP')}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
