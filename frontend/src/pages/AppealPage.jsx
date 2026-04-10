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
  pending:  { icon: FiClock,        color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200', label: 'Under review' },
  approved: { icon: FiCheckCircle,  color: 'text-green-600',  bg: 'bg-green-50  border-green-200', label: 'Approved — action reversed' },
  rejected: { icon: FiXCircle,      color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    label: 'Rejected' },
};

export default function AppealPage() {
  const { user } = useAuth();

  const [appeals, setAppeals]           = useState([]);
  const [loadingAppeals, setLoadingA]   = useState(true);

  // Form state
  const [action, setAction]       = useState('warn');
  const [commentContent, setCC]   = useState('');
  const [reason, setReason]       = useState('');
  const [submitting, setSub]      = useState(false);
  const [showForm, setShowForm]   = useState(false);

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
      const res = await api.post('/appeals', {
        action,
        commentContent: commentContent.trim(),
        reason:         reason.trim(),
      });
      setAppeals(prev => [res.data.appeal, ...prev]);
      setShowForm(false);
      setCC('');
      setReason('');
      toast.success('Appeal submitted — our team will review it');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit appeal');
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FiShield className="text-2xl text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Moderation Appeals</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          If you believe a moderation action taken against one of your comments was incorrect,
          you can submit an appeal here. Our team reviews all appeals within 3–5 business days.
        </p>
      </div>

      {/* Warn / suspend / ban notice */}
      {(user?.banned || user?.isSuspended) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-700 mb-1">
            {user.banned ? 'Your account has been banned' : 'Your account is suspended'}
          </p>
          <p className="text-xs text-red-500">
            {user.banned
              ? 'You cannot post comments. Submit an appeal below if you believe this was a mistake.'
              : `Suspended until ${user.suspendedUntil ? format(new Date(user.suspendedUntil), 'PPP') : '—'}. Submit an appeal if you believe this was incorrect.`}
          </p>
        </div>
      )}

      {/* Submit button */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="mb-8 px-5 py-2.5 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-700 transition">
          + Submit a new appeal
        </button>
      ) : (
        <form onSubmit={submitAppeal}
          className="mb-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">New appeal</h2>

          {/* Action type */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Which action are you appealing?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_REASONS.map(a => (
                <label key={a.id}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                    action === a.id ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}>
                  <input type="radio" name="action" value={a.id} checked={action === a.id}
                    onChange={() => setAction(a.id)} className="accent-gray-900" />
                  <span className="text-sm text-gray-700">{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Comment content */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Paste the comment that was actioned
            </label>
            <textarea
              value={commentContent}
              onChange={e => setCC(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Copy and paste the exact content of the comment that was removed or penalised…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none
                focus:outline-none focus:border-gray-400 transition-colors"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">{commentContent.length} / 1000</p>
          </div>

          {/* Appeal reason */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Why do you believe this action was incorrect?
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Explain clearly why you think this decision should be reconsidered…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none
                focus:outline-none focus:border-gray-400 transition-colors"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">{reason.length} / 500</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5">
            <p className="text-xs text-blue-600 leading-relaxed">
              Appeals are reviewed by our moderation team. Submitting false or repeated appeals may result in additional restrictions.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !commentContent.trim() || !reason.trim()}
              className="px-5 py-2 text-sm bg-gray-900 text-white rounded-full hover:bg-gray-700 transition disabled:opacity-40">
              {submitting ? 'Submitting…' : 'Submit appeal'}
            </button>
          </div>
        </form>
      )}

      {/* My appeals list */}
      <h2 className="font-semibold text-gray-900 mb-4">My appeals</h2>

      {loadingAppeals ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : appeals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
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
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {ACTION_REASONS.find(x => x.id === a.action)?.label || a.action}
                    </span>
                    <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Commented content snapshot */}
                <div className="bg-white/70 rounded-lg px-3 py-2 mb-2">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Your comment</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{a.commentContent}</p>
                </div>

                {/* Reason */}
                <p className="text-xs text-gray-500 mb-1"><span className="font-medium">Your reason:</span> {a.reason}</p>

                {/* Admin note */}
                {a.adminNote && (
                  <p className="text-xs text-gray-500 italic">
                    <span className="font-medium">Admin note:</span> {a.adminNote}
                  </p>
                )}
                {a.reviewedBy && (
                  <p className="text-xs text-gray-400 mt-1">
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
