import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { courses } from '../data/courses.js';
import { universities } from '../data/universities.js';
import { submitApplications } from '../services/api.js';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Mail,
  Send,
  User,
} from 'lucide-react';

export default function ApplicationPage() {
  const { user, apsScore } = useAuth();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qualifyingCourses = useMemo(
    () => courses.filter((course) => apsScore >= course.minAps),
    [apsScore]
  );

  const applicantName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Student';

  const toggleCourse = (courseId, uniId) => {
    setFormError('');
    setSelectedCourses((current) => {
      const exists = current.some((item) => item.courseId === courseId && item.uniId === uniId);

      if (exists) {
        return current.filter((item) => !(item.courseId === courseId && item.uniId === uniId));
      }

      return [...current, { courseId, uniId }];
    });
  };

  const isSelected = (courseId, uniId) => {
    return selectedCourses.some((item) => item.courseId === courseId && item.uniId === uniId);
  };

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      return;
    }

    const applications = selectedCourses.map((item) => {
      const course = courses.find((courseItem) => courseItem.id === item.courseId);
      const university = universities.find((uni) => uni.id === item.uniId);

      return {
        course_id: course?.id,
        course_name: course?.name,
        university_id: university?.id,
        university_name: university?.name,
      };
    });

    if (applications.some((application) => !application.course_name || !application.university_name)) {
      setFormError('One of the selected applications could not be matched to a course or university.');
      return;
    }

    try {
      setFormError('');
      setIsSubmitting(true);

      const data = await submitApplications(applications);

      setSubmittedApplications(data.applications);
      setSelectedCourses([]);
      setSubmitted(true);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Applications Submitted!</h2>
          <p className="text-gray-500 mb-8">
            Your applications have been saved. Use these reference numbers when tracking progress.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-bold mb-4">Reference Numbers</h3>
            <div className="space-y-3">
              {submittedApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-gray-100"
                >
                  <div>
                    <p className="font-semibold text-sm">{application.course_name}</p>
                    <p className="text-xs text-gray-500">{application.university_name}</p>
                  </div>
                  <span className="badge-primary font-mono text-xs whitespace-nowrap">
                    {application.reference_number}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setSubmitted(false)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Submit More
            </button>
            <Link to="/track" className="btn-primary inline-flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Track Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-accent" />
          Submit Applications
        </h1>
        <p className="text-gray-500">Select courses and universities to apply to</p>
      </div>

      <div className="card mb-6 bg-gray-50">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Applicant Information
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="font-semibold text-sm">{applicantName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold text-sm">{user?.email || 'No email found'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">APS Score</p>
              <p className="font-semibold text-sm">{apsScore} / 42</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-accent" />
          Select Courses to Apply ({selectedCourses.length} selected)
        </h3>

        {qualifyingCourses.length === 0 ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
            Calculate and save your APS first, or improve your APS to see qualifying courses here.
          </div>
        ) : (
          <div className="space-y-4">
            {qualifyingCourses.map((course) => {
              const courseUniversities = course.universities
                .map((id) => universities.find((uni) => uni.id === id))
                .filter(Boolean);

              return (
                <div key={course.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold">{course.name}</h4>
                      <p className="text-sm text-gray-500">{course.field} - Min APS: {course.minAps}</p>
                    </div>
                    <span className="badge-accent text-xs">Qualifies</span>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {courseUniversities.map((uni) => {
                      const selected = isSelected(course.id, uni.id);

                      return (
                        <button
                          key={uni.id}
                          onClick={() => toggleCourse(course.id, uni.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                            selected
                              ? 'border-accent bg-accent/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            selected ? 'border-accent bg-accent' : 'border-gray-300'
                          }`}>
                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{uni.abbr}</p>
                            <p className="text-xs text-gray-500">{uni.location}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {formError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{formError}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedCourses.length === 0 || isSubmitting}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
          selectedCourses.length > 0 && !isSubmitting
            ? 'bg-accent text-white hover:bg-teal-600 shadow-lg'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Send className="w-5 h-5" />
        {isSubmitting
          ? 'Submitting...'
          : `Submit ${selectedCourses.length} Application${selectedCourses.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}
