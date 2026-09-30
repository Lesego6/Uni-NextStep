import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Save,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import SelectMenu from '../components/SelectMenu.jsx';
import { getApplicationProfileData, saveApplicationProfileData } from '../services/api.js';

const emptyProfile = {
  address_line1: '',
  address_line2: '',
  city: '',
  province: '',
  postal_code: '',
  contact_number: '',
  guardian_name: '',
  guardian_relationship: '',
  guardian_contact: '',
  guardian_email: '',
};

const provinceOptions = [
  { value: '', label: 'Select province' },
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

const fallbackRequiredDocuments = ['ID Document', 'Latest Results', 'Proof of Address'];
const maxDocumentSizeBytes = 2 * 1024 * 1024;

function formatFileSize(size) {
  if (!size) {
    return '0 KB';
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function ApplicationDocuments() {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [documents, setDocuments] = useState([]);
  const [requiredDocuments, setRequiredDocuments] = useState(fallbackRequiredDocuments);
  const [selectedDocumentType, setSelectedDocumentType] = useState(fallbackRequiredDocuments[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError('');
        const data = await getApplicationProfileData();
        setProfile({ ...emptyProfile, ...(data.profile || {}) });
        setDocuments(data.documents || []);
        setRequiredDocuments(data.required_documents || fallbackRequiredDocuments);
        setSelectedDocumentType((data.required_documents || fallbackRequiredDocuments)[0]);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const uploadedTypes = useMemo(() => new Set(documents.map((document) => document.document_type)), [documents]);
  const missingDocuments = requiredDocuments.filter((documentType) => !uploadedTypes.has(documentType));
  const requiredProfileFields = [
    profile.address_line1,
    profile.city,
    profile.province,
    profile.postal_code,
    profile.contact_number,
    profile.guardian_name,
    profile.guardian_contact,
  ];
  const detailsComplete = requiredProfileFields.every((value) => String(value || '').trim());
  const documentsComplete = missingDocuments.length === 0;

  const handleProfileChange = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setSuccess('');
  };

  const handleFileChange = (file) => {
    setError('');
    setSuccess('');

    if (!file) {
      return;
    }

    if (file.size > maxDocumentSizeBytes) {
      setError('Each document must be smaller than 2 MB.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const contentBase64 = result.includes(',') ? result.split(',').pop() : result;

      setDocuments((current) => [
        ...current.filter((document) => document.document_type !== selectedDocumentType),
        {
          document_type: selectedDocumentType,
          file_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          file_size: file.size,
          content_base64: contentBase64,
        },
      ]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => setError('Could not read the selected file.');
    reader.readAsDataURL(file);
  };

  const removeDocument = (documentType) => {
    setDocuments((current) => current.filter((document) => document.document_type !== documentType));
    setSuccess('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const data = await saveApplicationProfileData({ profile, documents });
      setProfile({ ...emptyProfile, ...(data.profile || {}) });
      setDocuments(data.documents || []);
      setRequiredDocuments(data.required_documents || fallbackRequiredDocuments);
      setSuccess(data.message || 'Application details saved successfully.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="card text-center text-sm font-semibold text-primary">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          Loading application details...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-accent" />
            Application Details
          </h1>
          <p className="text-gray-500">Address, guardian information, and required documents</p>
        </div>

        <Link to="/apply" className="btn-secondary inline-flex items-center justify-center gap-2">
          Go to Apply
          <ArrowRight className="w-4 h-4" />
        </Link>
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

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section className="card">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
            <MapPin className="w-5 h-5 text-accent" />
            Contact Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Address line 1</span>
              <input
                value={profile.address_line1}
                onChange={(event) => handleProfileChange('address_line1', event.target.value)}
                className="input-field"
              />
            </label>

            <label className="md:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Address line 2</span>
              <input
                value={profile.address_line2}
                onChange={(event) => handleProfileChange('address_line2', event.target.value)}
                className="input-field"
              />
            </label>

            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">City</span>
              <input
                value={profile.city}
                onChange={(event) => handleProfileChange('city', event.target.value)}
                className="input-field"
              />
            </label>

            <SelectMenu
              label="Province"
              value={profile.province}
              options={provinceOptions}
              onChange={(value) => handleProfileChange('province', value)}
              icon={MapPin}
            />

            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Postal code</span>
              <input
                value={profile.postal_code}
                onChange={(event) => handleProfileChange('postal_code', event.target.value)}
                className="input-field"
              />
            </label>

            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Contact number</span>
              <input
                value={profile.contact_number}
                onChange={(event) => handleProfileChange('contact_number', event.target.value)}
                className="input-field"
              />
            </label>
          </div>

          <h2 className="my-5 flex items-center gap-2 text-xl font-bold">
            <User className="w-5 h-5 text-accent" />
            Guardian Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Guardian name</span>
              <input
                value={profile.guardian_name}
                onChange={(event) => handleProfileChange('guardian_name', event.target.value)}
                className="input-field"
              />
            </label>

            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</span>
              <input
                value={profile.guardian_relationship}
                onChange={(event) => handleProfileChange('guardian_relationship', event.target.value)}
                className="input-field"
              />
            </label>

            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Guardian contact number</span>
              <input
                value={profile.guardian_contact}
                onChange={(event) => handleProfileChange('guardian_contact', event.target.value)}
                className="input-field"
              />
            </label>

            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Guardian email</span>
              <input
                type="email"
                value={profile.guardian_email}
                onChange={(event) => handleProfileChange('guardian_email', event.target.value)}
                className="input-field"
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
            <Upload className="w-5 h-5 text-accent" />
            Documents
          </h2>

          <div className="space-y-4">
            <SelectMenu
              label="Document type"
              value={selectedDocumentType}
              options={requiredDocuments}
              onChange={setSelectedDocumentType}
              icon={FileText}
            />

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Upload file</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(event) => handleFileChange(event.target.files?.[0])}
                className="input-field text-sm"
              />
            </label>

            <div className="space-y-3">
              {requiredDocuments.map((documentType) => {
                const document = documents.find((item) => item.document_type === documentType);
                return (
                  <div
                    key={documentType}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
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
                      {document && (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {document.file_name} - {formatFileSize(document.file_size)}
                        </p>
                      )}
                    </div>
                    {document && (
                      <button
                        type="button"
                        onClick={() => removeDocument(documentType)}
                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                        aria-label={`Remove ${documentType}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-gray-100 bg-white px-3 py-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-accent" />
                <span>{detailsComplete ? 'Contact details complete' : 'Contact details incomplete'}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-gray-700">
                <FileText className="w-4 h-4 text-accent" />
                <span>{documentsComplete ? 'Documents complete' : `${missingDocuments.length} document${missingDocuments.length === 1 ? '' : 's'} missing`}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
