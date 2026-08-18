import { useState } from 'react';
import { getAdminReport } from '../services/api.js';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Shield,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

const reportStyles = {
  applications: {
    total: { icon: FileText, color: 'bg-blue-50 text-primary' },
    pending: { icon: Clock, color: 'bg-amber-50 text-amber-600' },
    accepted: { icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    rejected: { icon: XCircle, color: 'bg-red-50 text-red-600' },
  },
  users: {
    total: { icon: Users, color: 'bg-blue-50 text-primary' },
    active: { icon: TrendingUp, color: 'bg-teal-50 text-accent' },
    students: { icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' },
    admins: { icon: Shield, color: 'bg-purple-50 text-purple-600' },
  },
};

function escapeCsv(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function AdminReports() {
  const [reportType, setReportType] = useState('applications');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      const data = await getAdminReport({
        type: reportType,
        startDate,
        endDate,
      });

      setReport(data.report);
    } catch (generateError) {
      setError(generateError.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) {
      return;
    }

    const rows = [
      ['Report', report.title],
      ['Start Date', report.start_date || 'All time'],
      ['End Date', report.end_date || 'All time'],
      ['Generated At', report.generated_at],
      [],
      ['Metric', 'Value'],
      ...report.stats.map((stat) => [stat.label, stat.value]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${report.type}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-accent" />
          Reports
        </h1>
        <p className="text-gray-500">Generate and view system reports</p>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setReport(null);
                  setError('');
                }}
                className="input-field"
              >
                <option value="applications">Applications</option>
                <option value="users">User Activity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  required
                  className="input-field pl-11"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  required
                  className="input-field pl-11"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <BarChart3 className="w-4 h-4" />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
      </div>

      {report && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-r from-primary to-blue-800 text-white border-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-1 text-white">{report.title}</h2>
                <p className="text-blue-200 text-sm">
                  {report.start_date && report.end_date
                    ? `${report.start_date} to ${report.end_date}`
                    : 'All time'}
                </p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-lg hover:bg-white/25 transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-2xl font-bold">{report.summary}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.stats.map((stat) => {
              const style = reportStyles[report.type]?.[stat.key] || reportStyles.users.total;
              const Icon = style.icon;

              return (
                <div key={stat.key} className="card">
                  <div className={`w-10 h-10 rounded-lg ${style.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
