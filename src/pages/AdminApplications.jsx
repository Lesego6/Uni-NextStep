import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCcw,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { getAllApplications, getApplicationDetails, updateApplicationStatus } from '../services/api.js';
import SelectMenu from '../components/SelectMenu.jsx';

const statuses = ['All', 'Pending', 'Accepted', 'Rejected'];
const rejectionReasons = [
  'Space constraints',
  'Requirements not met',
  'Missing/incomplete documents',
  'Application closed',
  'Duplicate application',
  'Other',
];

function fieldValue(value) {
  return value || 'Not provided';
}

function isFilled(value) {
  return Boolean(String(value || '').trim());
}

function formatFileSize(size) {
  if (!size) {
    return '0 KB';
  }

  return `${Math.max(1, Math.round(Number(size) / 1024))} KB`;
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

function base64ToBlob(document) {
  const base64 = String(document.content_base64 || '').replace(/^data:[^;]+;base64,/, '');
  const byteCharacters = window.atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let index = 0; index < slice.length; index += 1) {
      byteNumbers[index] = slice.charCodeAt(index);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: document.mime_type || 'application/octet-stream' });
}

function createDocumentUrl(document) {
  return URL.createObjectURL(base64ToBlob(document));
}

function downloadDocument(document) {
  const link = window.document.createElement('a');
  const url = createDocumentUrl(document);
  link.href = url;
  link.download = document.file_name || `${document.document_type}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-700">{fieldValue(value)}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusClass = status === 'Accepted'
    ? 'bg-green-100 text-green-700'
    : status === 'Rejected'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';

  return <span className={`badge text-xs ${statusClass}`}>{status}</span>;
}

function EmailStatusBadge({ status }) {
  const statusClass = status === 'sent'
    ? 'bg-green-100 text-green-700'
    : status === 'failed'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600';

  return <span className={`badge text-xs ${statusClass}`}>{status}</span>;
}

function getReviewChecks(details) {
  if (!details) {
    return [];
  }

  const profile = details.profile || {};
  const studentAps = Number(details.student?.aps_score || 0);
  const minAps = Number(details.application?.course_min_aps || 0);
  const contactComplete = [
    profile.address_line1,
    profile.city,
    profile.province,
    profile.postal_code,
    profile.contact_number,
  ].every(isFilled);
  const guardianComplete = [
    profile.guardian_name,
    profile.guardian_contact,
  ].every(isFilled);

  return [
    {
      label: 'Documents uploaded',
      complete: Boolean(details.documents_complete),
      detail: details.documents_complete ? 'All required files are present' : 'Required files are missing',
    },
    {
      label: 'APS requirement',
      complete: minAps === 0 || studentAps >= minAps,
      detail: minAps > 0 ? `${studentAps} / ${minAps}` : `${studentAps} APS`,
    },
    {
      label: 'Contact details',
      complete: contactComplete,
      detail: contactComplete ? 'Address and contact number saved' : 'Address/contact is incomplete',
    },
    {
      label: 'Guardian details',
      complete: guardianComplete,
      detail: guardianComplete ? 'Guardian contact saved' : 'Guardian contact is incomplete',
    },
  ];
}

export default function AdminApplications() {
  const previewUrlRef = useRef(null);
  const [applications, setApplications] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(rejectionReasons[1]);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllApplications();
      setApplications(data.applications || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    if (selectedStatus === 'All') {
      return applications;
    }

    return applications.filter((application) => application.status === selectedStatus);
  }, [applications, selectedStatus]);

  const applicationStats = useMemo(() => {
    return applications.reduce(
      (stats, application) => ({
        ...stats,
        total: stats.total + 1,
        [application.status]: (stats[application.status] || 0) + 1,
      }),
      { total: 0, Pending: 0, Accepted: 0, Rejected: 0 }
    );
  }, [applications]);

  const reviewChecks = useMemo(() => getReviewChecks(detailsDialog), [detailsDialog]);
  const readyForDecision = reviewChecks.length > 0 && reviewChecks.every((check) => check.complete);

  const openDetails = async (application) => {
    try {
      setError('');
      setDetailsLoadingId(application.id);
      const data = await getApplicationDetails(application.id);
      setDetailsDialog(data);
    } catch (detailsError) {
      setError(detailsError.message);
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const updateStatus = async (applicationId, nextStatus, details = {}) => {
    try {
      setBusyId(applicationId);
      const data = await updateApplicationStatus(applicationId, nextStatus, details);
      setApplications((current) => current.map((application) => (
        application.id === applicationId ? { ...application, ...data.application } : application
      )));
      if (detailsDialog?.application?.id === applicationId) {
        const refreshedDetails = await getApplicationDetails(applicationId);
        setDetailsDialog(refreshedDetails);
      }
      setStatusDialog(null);
      setStatusNote('');
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusyId(null);
    }
  };

  const openRejectDialog = (application) => {
    setError('');
    setStatusDialog(application);
    setRejectionReason(
      rejectionReasons.includes(application.rejection_reason)
        ? application.rejection_reason
        : rejectionReasons[1]
    );
    setStatusNote(application.status_note || '');
  };

  const openDocumentPreview = (document) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    try {
      const url = createDocumentUrl(document);
      previewUrlRef.current = url;
      setDocumentPreview({
        ...document,
        url
      });
    } catch {
      setError('Could not open this document. Try downloading it instead.');
    }
  };

  const closeDocumentPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setDocumentPreview(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-accent" />
            Application Management
          </h1>
          <p className="text-gray-500">Review and triage student applications</p>
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

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: applicationStats.total, className: 'bg-primary text-white' },
          { label: 'Pending', value: applicationStats.Pending, className: 'bg-amber-50 text-amber-700' },
          { label: 'Accepted', value: applicationStats.Accepted, className: 'bg-green-50 text-green-700' },
          { label: 'Rejected', value: applicationStats.Rejected, className: 'bg-red-50 text-red-700' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg px-4 py-3 ${stat.className}`}>
            <p className="text-xs font-semibold uppercase opacity-80">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="md:w-72">
            <SelectMenu
              value={selectedStatus}
              options={statuses}
              onChange={setSelectedStatus}
              icon={Filter}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="card text-center text-sm font-semibold text-primary">
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="card text-center text-sm text-gray-400">
            No applications found.
          </div>
        ) : (
          filteredApplications.map((application) => (
            <div key={application.id} className="card">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-primary">{application.student_name}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{application.student_email}</p>
                </div>
                <StatusBadge status={application.status} />
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Course</p>
                  <p className="font-medium text-gray-700">{application.course_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">University</p>
                  <p className="font-medium text-gray-700">{application.university_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Reference</p>
                  <p className="font-mono text-xs text-gray-500">{application.reference_number}</p>
                </div>
              </div>

              {application.status === 'Rejected' && application.rejection_reason && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <span className="font-semibold">{application.rejection_reason}</span>
                  {application.status_note && <span> - {application.status_note}</span>}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  disabled={detailsLoadingId === application.id}
                  onClick={() => openDetails(application)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {detailsLoadingId === application.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  View
                </button>
                {application.status !== 'Accepted' && (
                  <button
                    disabled={busyId === application.id}
                    onClick={() => updateStatus(application.id, 'Accepted')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accept
                  </button>
                )}
                {application.status !== 'Rejected' && (
                  <button
                    disabled={busyId === application.id}
                    onClick={() => openRejectDialog(application)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}
                {application.status !== 'Pending' && (
                  <button
                    disabled={busyId === application.id}
                    onClick={() => updateStatus(application.id, 'Pending')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
                  >
                    <Clock3 className="w-3.5 h-3.5" />
                    Pending
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Course</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">University</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reference</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-sm font-semibold text-primary">
                    Loading applications...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                    No applications found.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr key={application.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-primary">{application.student_name}</div>
                      <div className="text-xs text-gray-500">{application.student_email}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{application.course_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{application.university_name}</td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-500">{application.reference_number}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={application.status} />
                      {application.status === 'Rejected' && application.rejection_reason && (
                        <div className="mt-2 max-w-xs text-xs text-gray-500">
                          <span className="font-semibold text-red-700">{application.rejection_reason}</span>
                          {application.status_note && <span> - {application.status_note}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          disabled={detailsLoadingId === application.id}
                          onClick={() => openDetails(application)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {detailsLoadingId === application.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          View
                        </button>
                        {application.status !== 'Accepted' && (
                          <button
                            disabled={busyId === application.id}
                            onClick={() => updateStatus(application.id, 'Accepted')}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Accept
                          </button>
                        )}
                        {application.status !== 'Rejected' && (
                          <button
                            disabled={busyId === application.id}
                            onClick={() => openRejectDialog(application)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        )}
                        {application.status !== 'Pending' && (
                          <button
                            disabled={busyId === application.id}
                            onClick={() => updateStatus(application.id, 'Pending')}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                          >
                            <Clock3 className="w-3.5 h-3.5" />
                            Pending
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailsDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                  <FileText className="w-6 h-6 text-accent" />
                  Application Details
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {detailsDialog.application.reference_number} - {detailsDialog.application.course_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsDialog(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close application details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-400">Status</p>
                <div className="mt-2"><StatusBadge status={detailsDialog.application.status} /></div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-400">APS</p>
                <p className="mt-1 text-lg font-bold text-primary">{detailsDialog.student.aps_score}</p>
                {detailsDialog.application.course_min_aps && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Minimum {detailsDialog.application.course_min_aps}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-400">Documents</p>
                <p className={`mt-1 text-sm font-semibold ${detailsDialog.documents_complete ? 'text-green-700' : 'text-amber-700'}`}>
                  {detailsDialog.documents_complete ? 'Complete' : 'Missing files'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-400">Account</p>
                <p className="mt-1 text-sm font-semibold text-gray-700">{fieldValue(detailsDialog.student.account_status)}</p>
              </div>
            </div>

            <section className={`mb-6 rounded-lg border px-4 py-4 ${
              readyForDecision ? 'border-green-100 bg-green-50/60' : 'border-amber-100 bg-amber-50/60'
            }`}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-primary">Decision Checklist</h3>
                  <p className={`mt-1 text-sm font-semibold ${
                    readyForDecision ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {readyForDecision ? 'Ready for an admin decision' : 'Review before accepting'}
                  </p>
                </div>
                <StatusBadge status={detailsDialog.application.status} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {reviewChecks.map((check) => (
                  <div key={check.label} className="rounded-lg bg-white px-3 py-3">
                    <div className="flex items-center gap-2">
                      {check.complete ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      )}
                      <p className="text-sm font-semibold text-primary">{check.label}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{check.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-gray-100 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <User className="w-5 h-5 text-accent" />
                  Student
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Name" value={detailsDialog.student.name} />
                  <DetailField label="Email" value={detailsDialog.student.email} />
                  <DetailField label="Grade" value={detailsDialog.student.grade} />
                  <DetailField label="School" value={detailsDialog.student.school} />
                  <DetailField label="School province" value={detailsDialog.student.school_province} />
                  <DetailField label="Course" value={detailsDialog.application.course_name} />
                  <DetailField label="University" value={detailsDialog.application.university_name} />
                  <DetailField label="Reference" value={detailsDialog.application.reference_number} />
                </div>
              </section>

              <section className="rounded-lg border border-gray-100 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <MapPin className="w-5 h-5 text-accent" />
                  Contact
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Address line 1" value={detailsDialog.profile?.address_line1} />
                  <DetailField label="Address line 2" value={detailsDialog.profile?.address_line2} />
                  <DetailField label="City" value={detailsDialog.profile?.city} />
                  <DetailField label="Province" value={detailsDialog.profile?.province} />
                  <DetailField label="Postal code" value={detailsDialog.profile?.postal_code} />
                  <DetailField label="Contact number" value={detailsDialog.profile?.contact_number} />
                </div>
              </section>

              <section className="rounded-lg border border-gray-100 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <Phone className="w-5 h-5 text-accent" />
                  Guardian
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Name" value={detailsDialog.profile?.guardian_name} />
                  <DetailField label="Relationship" value={detailsDialog.profile?.guardian_relationship} />
                  <DetailField label="Contact number" value={detailsDialog.profile?.guardian_contact} />
                  <DetailField label="Email" value={detailsDialog.profile?.guardian_email} />
                </div>
              </section>

              <section className="rounded-lg border border-gray-100 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  Review Notes
                </h3>
                <div className="space-y-3">
                  <DetailField label="Rejection reason" value={detailsDialog.application.rejection_reason} />
                  <DetailField label="Status note" value={detailsDialog.application.status_note} />
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-lg border border-gray-100 p-4">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <FileText className="w-5 h-5 text-accent" />
                Documents
              </h3>
              <div className="space-y-3">
                {detailsDialog.required_documents.map((documentType) => {
                  const document = detailsDialog.documents.find((item) => item.document_type === documentType);
                  return (
                    <div
                      key={documentType}
                      className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {document ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                          )}
                          <p className="text-sm font-semibold text-primary">{documentType}</p>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {document ? `${document.file_name} - ${formatFileSize(document.file_size)}` : 'Not uploaded'}
                        </p>
                      </div>

                      {document && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(document)}
                            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadDocument(document)}
                            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-gray-100 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <Clock3 className="w-5 h-5 text-accent" />
                  Activity
                </h3>
                {detailsDialog.activity?.length ? (
                  <div className="space-y-3">
                    {[...detailsDialog.activity].reverse().map((event) => (
                      <div key={event.id} className="flex gap-3 rounded-lg bg-gray-50 px-3 py-3">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-primary">{event.title}</p>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase text-gray-500">
                              {event.actor_role || 'system'}
                            </span>
                          </div>
                          {event.message && (
                            <p className="mt-1 text-sm text-gray-500">{event.message}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-400">{formatDateTime(event.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">
                    No activity has been recorded yet.
                  </p>
                )}
              </section>

              <section className="rounded-lg border border-gray-100 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  Email History
                </h3>
                {detailsDialog.email_logs?.length ? (
                  <div className="space-y-3">
                    {detailsDialog.email_logs.map((emailLog) => (
                      <div key={emailLog.id} className="rounded-lg bg-gray-50 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-primary">
                            {emailLog.email_type.replace(/_/g, ' ')}
                          </p>
                          <EmailStatusBadge status={emailLog.status} />
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-500">{emailLog.recipient_email || 'No recipient'}</p>
                        {emailLog.error_message && (
                          <p className="mt-2 rounded-lg bg-white px-2 py-2 text-xs text-red-600">
                            {emailLog.error_message}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-400">{formatDateTime(emailLog.created_at)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">
                    No email attempts have been recorded yet.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {documentPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <FileText className="w-5 h-5 text-accent" />
                  {documentPreview.document_type}
                </h2>
                <p className="mt-1 truncate text-sm text-gray-500">
                  {documentPreview.file_name} - {formatFileSize(documentPreview.file_size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadDocument(documentPreview)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-primary hover:border-primary"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={closeDocumentPreview}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close document preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="min-h-[60vh] flex-1 bg-gray-100 p-4">
              {documentPreview.mime_type?.startsWith('image/') ? (
                <div className="flex h-full min-h-[60vh] items-center justify-center">
                  <img
                    src={documentPreview.url}
                    alt={documentPreview.file_name}
                    className="max-h-[72vh] max-w-full rounded-lg bg-white object-contain shadow-sm"
                  />
                </div>
              ) : documentPreview.mime_type === 'application/pdf' ? (
                <iframe
                  src={documentPreview.url}
                  title={documentPreview.file_name}
                  className="h-[72vh] w-full rounded-lg border border-gray-200 bg-white"
                />
              ) : (
                <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center">
                  <FileText className="mb-3 h-10 w-10 text-gray-300" />
                  <h3 className="text-lg font-bold text-primary">Preview unavailable</h3>
                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    This file type cannot be previewed in the browser. Download it to view the document.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {statusDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                  Rejection Reason
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {statusDialog.student_name} - {statusDialog.course_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusDialog(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close rejection reason dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <SelectMenu
                label="Reason"
                value={rejectionReason}
                options={rejectionReasons}
                onChange={setRejectionReason}
                icon={XCircle}
              />

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1.5">Note</span>
                <textarea
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="input-field resize-none"
                />
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setStatusDialog(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busyId === statusDialog.id}
                  onClick={() => updateStatus(statusDialog.id, 'Rejected', {
                    rejection_reason: rejectionReason,
                    status_note: statusNote,
                  })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
