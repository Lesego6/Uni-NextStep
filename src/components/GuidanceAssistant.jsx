import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAllApplications,
  getApplicationProfileData,
  getCourses,
  getMyApplications,
  getUniversities,
} from '../services/api.js';

const studentPrompts = [
  'What should I do next?',
  'Which courses do I qualify for?',
  'Are my documents complete?',
  'Why was I rejected?',
];

const adminPrompts = [
  'What needs attention?',
  'Summarize applications',
  'Show rejected issues',
  'What reports can I use?',
];

function createMessage(role, text) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
  };
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function formatList(items) {
  if (!items.length) {
    return '';
  }

  return items.map((item) => `- ${item}`).join('\n');
}

function countByStatus(applications = []) {
  return applications.reduce(
    (counts, application) => ({
      ...counts,
      total: counts.total + 1,
      [application.status]: (counts[application.status] || 0) + 1,
    }),
    { total: 0, Pending: 0, Accepted: 0, Rejected: 0 }
  );
}

function getMissingProfileFields(profile = {}) {
  const required = [
    ['address_line1', 'address line 1'],
    ['city', 'city'],
    ['province', 'province'],
    ['postal_code', 'postal code'],
    ['contact_number', 'contact number'],
    ['guardian_name', 'guardian name'],
    ['guardian_contact', 'guardian contact number'],
  ];

  return required
    .filter(([field]) => !String(profile[field] || '').trim())
    .map(([, label]) => label);
}

function getCourseUniversities(course, universities) {
  return (course.universities || [])
    .map((id) => universities.find((university) => university.id === id))
    .filter(Boolean);
}

function buildStudentResponse(input, context, apsScore) {
  const text = normalizeText(input);
  const applications = context.applications || [];
  const courses = context.courses || [];
  const universities = context.universities || [];
  const profileData = context.profileData || {};
  const stats = countByStatus(applications);

  if (text.includes('course') || text.includes('qualify') || text.includes('aps')) {
    if (!Number(apsScore)) {
      return 'Start by calculating your APS on the APS Calculator page. Once your APS is saved, I can point you to matching courses.';
    }

    const qualifyingCourses = courses
      .filter((course) => Number(apsScore) >= Number(course.minAps || 0))
      .sort((a, b) => Number(b.minAps || 0) - Number(a.minAps || 0))
      .slice(0, 5);

    if (!qualifyingCourses.length) {
      return `Your saved APS is ${apsScore}. I could not find qualifying courses in the current catalog yet. Try browsing Courses after recalculating APS or ask an admin to check the course catalog.`;
    }

    return [
      `Your saved APS is ${apsScore}. Strong matches include:`,
      formatList(qualifyingCourses.map((course) => {
        const offeredAt = getCourseUniversities(course, universities).slice(0, 2).map((university) => university.abbr || university.name);
        return `${course.name} (min APS ${course.minAps})${offeredAt.length ? ` at ${offeredAt.join(', ')}` : ''}`;
      })),
      'Open Courses to filter by field or province, then use Apply when you are ready.',
    ].join('\n\n');
  }

  if (text.includes('document') || text.includes('upload') || text.includes('missing')) {
    const requiredDocuments = profileData.required_documents || [];
    const uploadedTypes = new Set((profileData.documents || []).map((document) => document.document_type));
    const missingDocuments = requiredDocuments.filter((documentType) => !uploadedTypes.has(documentType));
    const missingFields = getMissingProfileFields(profileData.profile || {});

    if (!missingDocuments.length && !missingFields.length) {
      return 'Your application details look complete: required documents are uploaded, and your address/contact/guardian details are saved.';
    }

    const parts = [];
    if (missingDocuments.length) {
      parts.push(`Missing documents:\n${formatList(missingDocuments)}`);
    }
    if (missingFields.length) {
      parts.push(`Missing details:\n${formatList(missingFields)}`);
    }

    return `${parts.join('\n\n')}\n\nOpen Documents to fix these before applying or requesting another review.`;
  }

  if (text.includes('reject') || text.includes('reason') || text.includes('why')) {
    const rejected = applications.filter((application) => application.status === 'Rejected');

    if (!rejected.length) {
      return 'You do not currently have rejected applications. Check Track for the latest status timeline.';
    }

    return [
      'Rejected applications:',
      formatList(rejected.map((application) => (
        `${application.course_name}: ${application.rejection_reason || 'No reason recorded'}${application.status_note ? ` - ${application.status_note}` : ''}`
      ))),
      'If the reason is missing documents/details, update Documents and then use Request review on the tracker.',
    ].join('\n\n');
  }

  if (text.includes('status') || text.includes('track') || text.includes('application')) {
    if (!applications.length) {
      return 'You have not submitted applications yet. Calculate APS, complete Documents, then open Apply to submit.';
    }

    return [
      `You have ${stats.total} application${stats.total === 1 ? '' : 's'}: ${stats.Pending} pending, ${stats.Accepted} accepted, ${stats.Rejected} rejected.`,
      formatList(applications.slice(0, 4).map((application) => (
        `${application.course_name} at ${application.university_name}: ${application.status}`
      ))),
      'Open Track for the full timeline and activity log.',
    ].join('\n\n');
  }

  if (text.includes('next') || text.includes('help') || text.includes('start')) {
    if (!Number(apsScore)) {
      return 'Best next step: calculate your APS. After that, browse qualifying courses, complete Documents, and submit applications.';
    }

    if (!applications.length) {
      return 'Best next step: complete your Documents page, then open Courses or Apply. Your saved APS will be used to check whether you qualify.';
    }

    if (stats.Rejected > 0) {
      return 'Best next step: open Track, review rejection reasons, update Documents if needed, and request another review.';
    }

    return 'Best next step: keep checking Track and the notification bell. Admin updates will appear there even if email delivery fails.';
  }

  return 'I can help with APS, qualifying courses, missing documents, application status, rejection reasons, and next steps. Try asking “Which courses do I qualify for?” or “Are my documents complete?”';
}

function buildAdminResponse(input, context) {
  const text = normalizeText(input);
  const applications = context.adminApplications || [];
  const stats = countByStatus(applications);
  const rejectedWithReasons = applications.filter((application) => application.status === 'Rejected' && application.rejection_reason);

  if (text.includes('attention') || text.includes('pending') || text.includes('workload')) {
    if (!applications.length) {
      return 'There are no applications in the system yet.';
    }

    return [
      `Current workload: ${stats.Pending} pending, ${stats.Accepted} accepted, ${stats.Rejected} rejected.`,
      stats.Pending > 0
        ? 'Open Application Management and start with pending applications that have complete documents and enough APS.'
        : 'No pending applications need review right now.',
    ].join('\n\n');
  }

  if (text.includes('summar') || text.includes('application')) {
    return [
      `Total applications: ${stats.total}`,
      `Pending: ${stats.Pending}`,
      `Accepted: ${stats.Accepted}`,
      `Rejected: ${stats.Rejected}`,
      'Use Application Management for the decision checklist, document preview, activity log, and email history.',
    ].join('\n');
  }

  if (text.includes('reject') || text.includes('issue')) {
    if (!rejectedWithReasons.length) {
      return 'There are no rejected applications with recorded reasons right now.';
    }

    return [
      'Recent rejected issues:',
      formatList(rejectedWithReasons.slice(0, 5).map((application) => (
        `${application.student_name || 'Student'} - ${application.course_name}: ${application.rejection_reason}`
      ))),
    ].join('\n\n');
  }

  if (text.includes('report')) {
    return 'Open Reports to generate application or user reports by date range. For marking/demo purposes, export or screenshot the generated totals.';
  }

  if (text.includes('user') || text.includes('duplicate')) {
    return 'Open User Management to search users, activate/deactivate accounts, delete test users, and review duplicate email warnings.';
  }

  return 'I can summarize application workload, rejected issues, reports, and user-management tasks. Try asking “What needs attention?” or “Summarize applications.”';
}

export default function GuidanceAssistant() {
  const { apsScore, isAdmin, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const messageEndRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loadingContext, setLoadingContext] = useState(false);
  const [context, setContext] = useState({});
  const [messages, setMessages] = useState(() => [
    createMessage('assistant', 'Hi, I am Uni Guide. Ask me about APS, courses, documents, applications, or admin workload.'),
  ]);

  const quickPrompts = isAdmin ? adminPrompts : studentPrompts;

  const loadContext = useCallback(async () => {
    if (!isLoggedIn && !isAdmin) {
      return;
    }

    try {
      setLoadingContext(true);
      if (isAdmin) {
        const applicationsData = await getAllApplications();
        setContext({ adminApplications: applicationsData.applications || [] });
        return;
      }

      const [applicationsData, profileData, coursesData, universitiesData] = await Promise.all([
        getMyApplications(),
        getApplicationProfileData(),
        getCourses(),
        getUniversities(),
      ]);

      setContext({
        applications: applicationsData.applications || [],
        profileData,
        courses: coursesData.courses || [],
        universities: universitiesData.universities || [],
      });
    } catch {
      setContext({});
    } finally {
      setLoadingContext(false);
    }
  }, [isAdmin, isLoggedIn]);

  useEffect(() => {
    if (open) {
      loadContext();
    }
  }, [loadContext, open]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const assistantTitle = useMemo(() => (
    isAdmin ? 'Admin Guide' : 'Student Guide'
  ), [isAdmin]);

  const answerQuestion = (question) => {
    if (isAdmin) {
      return buildAdminResponse(question, context);
    }

    return buildStudentResponse(question, context, apsScore);
  };

  const sendMessage = (question = input) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const response = answerQuestion(trimmedQuestion);
    setMessages((current) => [
      ...current,
      createMessage('user', trimmedQuestion),
      createMessage('assistant', response),
    ]);
    setInput('');
  };

  const goToSuggestedPage = () => {
    if (isAdmin) {
      navigate('/admin/applications');
      setOpen(false);
      return;
    }

    navigate('/track');
    setOpen(false);
  };

  if (!isLoggedIn && !isAdmin) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform hover:scale-105"
        aria-label="Open Uni Guide"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-label="Close assistant overlay"
          />

          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-white shadow-2xl sm:m-4 sm:h-[calc(100vh-2rem)] sm:rounded-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-primary px-5 py-4 text-white sm:rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Bot className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{assistantTitle}</h2>
                  <p className="text-xs text-blue-100">
                    {loadingContext ? 'Reading your app data...' : `Ready for ${user?.name || 'you'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-100 px-4 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  {loadingContext ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-accent" />}
                  Context-aware guide
                </div>
                <button
                  type="button"
                  onClick={goToSuggestedPage}
                  className="rounded-lg bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  {isAdmin ? 'Open reviews' : 'Open tracker'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-accent hover:text-accent"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm shadow-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-accent">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Uni Guide
                      </div>
                    )}
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="border-t border-gray-100 bg-white p-4 sm:rounded-b-xl"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={isAdmin ? 'Ask about pending applications...' : 'Ask about courses, documents, status...'}
                  className="input-field min-w-0 flex-1"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-white hover:bg-teal-600"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
