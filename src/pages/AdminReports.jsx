import { useState } from 'react';
import { BarChart3, Calendar, FileText, Download, TrendingUp, Users, GraduationCap, CheckCircle2, Clock, XCircle, Shield } from 'lucide-react';

export default function AdminReports() {
  const [reportType, setReportType] = useState('applications');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generated, setGenerated] = useState(false);

  const handleGenerate = (e) => {
    e.preventDefault();
    setGenerated(true);
  };

  const reportData = {
    applications: {
      title: 'Application Report',
      summary: '47 applications submitted',
      stats: [
        { label: 'Total Applications', value: '47', icon: FileText, color: 'bg-blue-50 text-primary' },
        { label: 'Pending', value: '18', icon: Clock, color: 'bg-amber-50 text-amber-600' },
        { label: 'Accepted', value: '22', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
        { label: 'Rejected', value: '7', icon: XCircle, color: 'bg-red-50 text-red-600' },
      ]
    },
    users: {
      title: 'User Activity Report',
      summary: '1,234 active users',
      stats: [
        { label: 'Total Users', value: '1,234', icon: Users, color: 'bg-blue-50 text-primary' },
        { label: 'New This Month', value: '156', icon: TrendingUp, color: 'bg-teal-50 text-accent' },
        { label: 'Students', value: '1,198', icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Admins', value: '36', icon: Shield, color: 'bg-purple-50 text-purple-600' },
      ]
    }
  };

  const currentReport = reportData[reportType];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-accent" />
          Reports
        </h1>
        <p className="text-gray-500">Generate and view system reports</p>
      </div>

      {/* Report Form */}
      <div className="card mb-6">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => { setReportType(e.target.value); setGenerated(false); }}
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
                  onChange={(e) => setStartDate(e.target.value)}
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
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Generate Report
          </button>
        </form>
      </div>

      {/* Report Results */}
      {generated && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-r from-primary to-blue-800 text-white border-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-1">{currentReport.title}</h2>
                <p className="text-blue-200 text-sm">
                  {startDate && endDate ? `${startDate} to ${endDate}` : 'All time'}
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-lg hover:bg-white/25 transition-all text-sm">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-2xl font-bold">{currentReport.summary}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentReport.stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="card">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
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