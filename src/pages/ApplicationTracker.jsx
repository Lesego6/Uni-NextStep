import { useState } from 'react';
import { mockApplications } from '../data/applications.js';
import { ClipboardList, Clock, CheckCircle2, XCircle, Filter } from 'lucide-react';

const statusConfig = {
  Pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  Accepted: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  Rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

const filters = ['All', 'Pending', 'Accepted', 'Rejected'];

export default function ApplicationTracker() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All' 
    ? mockApplications 
    : mockApplications.filter(a => a.status === activeFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-accent" />
          Application Tracker
        </h1>
        <p className="text-gray-500">Monitor the status of your university applications</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map(filter => (
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
                {mockApplications.filter(a => a.status === filter).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filtered.map(app => {
          const config = statusConfig[app.status];
          const StatusIcon = config.icon;

          return (
            <div key={app.id} className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{app.course}</h3>
                  <span className={`badge ${config.color} flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{app.university}</p>
                <p className="text-xs text-gray-400 mt-1">Submitted: {app.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge-primary font-mono text-xs">{app.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-2">No applications found</h3>
          <p className="text-gray-400">You don't have any {activeFilter.toLowerCase()} applications</p>
        </div>
      )}
    </div>
  );
}