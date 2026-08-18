import { useEffect, useMemo, useState } from 'react';
import { getMyApplications } from '../services/api.js';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Filter,
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

export default function ApplicationTracker() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadApplications = async () => {
    try {
      setError('');
      setLoading(true);

      const data = await getMyApplications();
      setApplications(data.applications);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

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
          onClick={loadApplications}
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
