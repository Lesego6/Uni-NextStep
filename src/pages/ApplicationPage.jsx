import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { submitApplications, getCourses, getUniversities } from '../services/api.js';
import {
  AlertCircle, ArrowLeft, CheckCircle2, ClipboardCheck, ClipboardList, 
  FileText, GraduationCap, Mail, Send, User, Loader2
} from 'lucide-react';

export default function ApplicationPage() {
  const { user, apsScore } = useAuth();
  const location = useLocation();
  
  const [courses, setCourses] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [skippedApplications, setSkippedApplications] = useState([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [courseData, uniData] = await Promise.all([getCourses(), getUniversities()]);
        setCourses(courseData.courses || []);
        setUniversities(uniData.universities || []);
      } catch (err) {
        setFormError("Could not load courses from the server.");
      } finally {
        setDataLoading(false);
      }
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preselectedCourseId = Number(params.get('courseId'));

    if (!preselectedCourseId || courses.length === 0 || universities.length === 0) {
      return;
    }

    const requestedCourse = courses.find((course) => course.id === preselectedCourseId);
    if (!requestedCourse || !Array.isArray(requestedCourse.universities)) {
      return;
    }

    const matches = requestedCourse.universities
      .map((uniId) => universities.find((uni) => uni.id === uniId))
      .filter(Boolean)
      .map((uni) => ({ courseId: requestedCourse.id, uniId: uni.id }));

    setSelectedCourses(matches);
  }, [courses, universities, location.search]);

  const qualifyingCourses = useMemo(
    () => courses.filter((course) => apsScore >= course.minAps),
    [courses, apsScore]
  );

  const applicantName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Student';

  const toggleCourse = (courseId, uniId) => {
    setFormError('');
    setSelectedCourses((current) => {
      const exists = current.some((item) => item.courseId === courseId && item.uniId === uniId);
      if (exists) return current.filter((item) => !(item.courseId === courseId && item.uniId === uniId));
      return [...current, { courseId, uniId }];
    });
  };

  const isSelected = (courseId, uniId) => selectedCourses.some((item) => item.courseId === courseId && item.uniId === uniId);

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) return;

    const applications = selectedCourses.map((item) => {
      const course = courses.find((c) => c.id === item.courseId);
      const university = universities.find((u) => u.id === item.uniId);
      return {
        course_id: course?.id,
        course_name: course?.name,
        university_id: university?.id,
        university_name: university?.name,
      };
    });

    try {
      setFormError('');
      setIsSubmitting(true);
      const data = await submitApplications(applications);
      setSubmittedApplications(data.applications || []);
      setSkippedApplications(data.skipped || []);
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
          {skippedApplications.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-left mt-4">
              <strong>{skippedApplications.length}</strong> duplicate application pair{skippedApplications.length === 1 ? '' : 's'} was skipped.
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button onClick={() => setSubmitted(false)} className="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Submit More
            </button>
            <Link to="/track" className="btn-primary inline-flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Track Applications
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
      </div>

      <div className="card mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-accent" />
          Select Courses to Apply ({selectedCourses.length} selected)
        </h3>

        {dataLoading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
        ) : qualifyingCourses.length === 0 ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
            Calculate and save your APS first to see qualifying courses here.
          </div>
        ) : (
          <div className="space-y-4">
            {qualifyingCourses.map((course) => {
              const courseUniversities = (course.universities || []).map((id) => universities.find((uni) => uni.id === id)).filter(Boolean);
              return (
                <div key={course.id} className="border border-gray-100 rounded-xl p-4">
                  <h4 className="font-bold">{course.name}</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                    {courseUniversities.map((uni) => {
                      const selected = isSelected(course.id, uni.id);
                      return (
                        <button
                          key={uni.id}
                          onClick={() => toggleCourse(course.id, uni.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left ${selected ? 'border-accent bg-accent/5' : 'border-gray-100'}`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? 'border-accent bg-accent' : 'border-gray-300'}`}>
                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{uni.abbr}</p>
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
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${selectedCourses.length > 0 && !isSubmitting ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'}`}
      >
        <Send className="w-5 h-5" />
        {isSubmitting ? 'Submitting...' : 'Submit Applications'}
      </button>
    </div>
  );
}