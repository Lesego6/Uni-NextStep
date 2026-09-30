import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplications, requestApplicationReview } from '../services/api.js';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Filter,
  Loader2,
  RefreshCcw,
  XCircle,
} from 'lucide-react';

const statusConfig = {
  Pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  Accepted: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  Rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

const filters = ['All', 'Pending', 'Accepted', 'Rejected'];

function formatDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value.replace(' ', 'T'));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) {
    return 'Unknown time';
  }

  const date = new Date(String(value).replace(' ', 'T'));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ApplicationActivity({ activity = [] }) {
  if (!activity.length) {
    return null;
  }

  const recentActivity = [...activity].slice(-4).reverse();

  return (
    <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
      <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Activity</p>
      <div className="space-y-2">
        {recentActivity.map((event) => (
          <div key={event.id} className="flex gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary">{event.title}</p>
              {event.message && (
                <p className="mt-0.5 text-xs text-gray-500">{event.message}</p>
              )}
              <p className="mt-0.5 text-[11px] text-gray-400">{formatDateTime(event.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationTimeline({ application }) {
  const isAccepted = application.status === 'Accepted';
  const isRejected = application.status === 'Rejected';
  const isFinal = isAccepted || isRejected;
  const finalDotClass = isAccepted
    ? 'border-green-500 bg-green-500'
    : isRejected
      ? 'border-red-500 bg-red-500'
      : 'border-gray-200 bg-white';

  const steps = [
    {
      label: 'Received',
      date: application.submitted_at,
      complete: true,
      dotClass: 'border-accent bg-accent',
    },
    {
      label: 'In review',
      date: application.status_updated_at || application.submitted_at,
      complete: true,
      dotClass: 'border-amber-500 bg-amber-500',
    },
    {
      label: isFinal ? application.status : 'Decision pending',
      date: isFinal ? application.status_updated_at : null,
      complete: isFinal,
      dotClass: finalDotClass,
    },
  ];

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-start gap-2">
          <div className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${step.dotClass}`} />
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${step.complete ? 'text-primary' : 'text-gray-400'}`}>
              {index + 1}. {step.label}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {step.date ? formatDate(step.date) : 'Waiting'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ApplicationTracker() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyReviewId, setBusyReviewId] = useState(null);

  const loadApplications = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (!silent) {
        setLoading(true);
      }

      const data = await getMyApplications();
      setApplications(data.applications || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadApplications();

    const intervalId = window.setInterval(() => {
      loadApplications({ silent: true });
    }, 30000);

    const handleFocus = () => {
      loadApplications({ silent: true });
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadApplications]);

  const statusCounts = useMemo(() => {
    return applications.reduce(
      (counts, application) => ({
        ...counts,
        [application.status]: (counts[application.status] || 0) + 1,
      }),
      { Pending: 0, Accepted: 0, Rejected: 0 }
    );
  }, [applications]);

  const filtered = activeFilter === 'All'
    ? applications
    : applications.filter((application) => application.status === activeFilter);

  const handleRequestReview = async (applicationId) => {
    try {
      setError('');
      setSuccess('');
      setBusyReviewId(applicationId);

      const data = await requestApplicationReview(applicationId);
      setApplications((current) => current.map((application) => (
        application.id === applicationId ? { ...application, ...data.application } : application
      )));
      setSuccess(data.message || 'Application sent back for review.');
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setBusyReviewId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-accent" />
            Application Tracker
          </h1>
          <p className="text-gray-500">Monitor the status of your university applications</p>
        </div>

        <button
          onClick={() => loadApplications()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition-all hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeFilter === filter
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'
            }`}
          >
            {filter === 'All' && <Filter className="w-4 h-4" />}
            {filter}
            {filter !== 'All' && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {statusCounts[filter]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="card text-center text-sm font-semibold text-primary">
          Loading applications...
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((application) => {
            const config = statusConfig[application.status] || statusConfig.Pending;
            const StatusIcon = config.icon;

            return (
              <div
                key={application.id}
                className="card flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold">{application.course_name}</h3>
                    <span className={`badge ${config.color} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {application.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{application.university_name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted: {formatDate(application.submitted_at)}
                  </p>
                  {application.status_updated_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Status updated: {formatDate(application.status_updated_at)}
                    </p>
                  )}
                  {application.status === 'Rejected' && application.rejection_reason && (
                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <p className="font-semibold">{application.rejection_reason}</p>
                      {application.status_note && (
                        <p className="mt-1 text-red-600">{application.status_note}</p>
                      )}
                    </div>
                  )}
                  <ApplicationTimeline application={application} />
                  <ApplicationActivity activity={application.activity} />
                  {application.status === 'Rejected' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to="/documents"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-primary hover:border-primary"
                      >
                        Update details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRequestReview(application.id)}
                        disabled={busyReviewId === application.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyReviewId === application.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-3.5 w-3.5" />
                        )}
                        Request review
                      </button>
                    </div>
                  )}
                </div>
                <span className="badge-primary font-mono text-xs">
                  {application.reference_number}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-2">No applications found</h3>
          <p className="text-gray-400">
            You do not have any {activeFilter.toLowerCase()} applications.
          </p>
        </div>
      )}
    </div>
  );
}
