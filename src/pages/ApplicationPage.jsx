import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { courses } from '../data/courses.js';
import { universities } from '../data/universities.js';
import { FileText, CheckCircle2, User, Mail, GraduationCap, Send, ArrowLeft, ClipboardCheck } from 'lucide-react';

export default function ApplicationPage() {
  const { user, apsScore } = useAuth();
  const [selectedCourses, setSelectedCourses] = useState([
    { courseId: 2, uniId: 1 },
    { courseId: 2, uniId: 6 },
    { courseId: 11, uniId: 25 },
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumbers, setReferenceNumbers] = useState([]);

  const toggleCourse = (courseId, uniId) => {
    const exists = selectedCourses.find(c => c.courseId === courseId && c.uniId === uniId);
    if (exists) {
      setSelectedCourses(selectedCourses.filter(c => !(c.courseId === courseId && c.uniId === uniId)));
    } else {
      setSelectedCourses([...selectedCourses, { courseId, uniId }]);
    }
  };

  const isSelected = (courseId, uniId) => {
    return selectedCourses.some(c => c.courseId === courseId && c.uniId === uniId);
  };

  const handleSubmit = () => {
    const refs = selectedCourses.map(() => 
      'APP-' + Math.random().toString(36).substr(2, 6).toUpperCase()
    );
    setReferenceNumbers(refs);
    setSubmitted(true);
  };

  const qualifyingCourses = courses.filter(c => apsScore >= c.minAps);

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Applications Submitted!</h2>
          <p className="text-gray-500 mb-8">Your applications have been successfully submitted to the selected universities.</p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-bold mb-4">Reference Numbers</h3>
            <div className="space-y-3">
              {selectedCourses.map((item, i) => {
                const course = courses.find(c => c.id === item.courseId);
                const uni = universities.find(u => u.id === item.uniId);
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <div>
                      <p className="font-semibold text-sm">{course?.name}</p>
                      <p className="text-xs text-gray-500">{uni?.name}</p>
                    </div>
                    <span className="badge-primary font-mono text-xs">{referenceNumbers[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => setSubmitted(false)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Submit More Applications
          </button>
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

      {/* Student Info Summary */}
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
              <p className="font-semibold text-sm">{user?.name || 'Thabo Nkosi'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold text-sm">{user?.email || 'thabo.nkosi@gmail.com'}</p>
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

      {/* Course Selection */}
      <div className="card mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-accent" />
          Select Courses to Apply ({selectedCourses.length} selected)
        </h3>

        <div className="space-y-4">
          {qualifyingCourses.map(course => {
            const courseUniversities = course.universities.map(id => universities.find(u => u.id === id)).filter(Boolean);

            return (
              <div key={course.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold">{course.name}</h4>
                    <p className="text-sm text-gray-500">{course.field} · Min APS: {course.minAps}</p>
                  </div>
                  <span className="badge-accent text-xs">Qualifies</span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {courseUniversities.map(uni => {
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
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedCourses.length === 0}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
          selectedCourses.length > 0
            ? 'bg-accent text-white hover:bg-teal-600 shadow-lg'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Send className="w-5 h-5" />
        Submit {selectedCourses.length} Application{selectedCourses.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
}