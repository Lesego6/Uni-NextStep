import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getCourses, getUniversities } from '../services/api.js';
import { Search, Filter, BookOpen, MapPin, GraduationCap, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

const fields = ['All', 'Health Sciences', 'Engineering', 'Science & Technology', 'Commerce', 'Law', 'Humanities', 'Education', 'Agriculture'];
const provinces = ['All', 'Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'North West', 'Free State', 'Northern Cape', 'Mpumalanga'];

export default function CourseRecommendations() {
  const { apsScore } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('All');
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        // Fetch both datasets concurrently
        const [courseData, uniData] = await Promise.all([getCourses(), getUniversities()]);
        setCourses(courseData.courses || []);
        setUniversities(uniData.universities || []);
      } catch (err) {
        setError("Failed to load course catalog. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesField = selectedField === 'All' || course.field === selectedField;
      const matchesTag = selectedTag === 'All' || course.field === selectedTag;

      let matchesProvince = true;
      if (selectedProvince !== 'All') {
        const courseUniversities = (course.universities || []).map(id => universities.find(u => u.id === id));
        matchesProvince = courseUniversities.some(u => u?.province === selectedProvince);
      }

      return matchesSearch && matchesField && matchesProvince && matchesTag;
    });
  }, [courses, universities, searchTerm, selectedField, selectedProvince, selectedTag]);

  const getUniversitiesForCourse = (course) => {
    return (course.universities || []).map(id => universities.find(u => u.id === id)).filter(Boolean);
  };

  const handleApply = (course) => {
    if (!course || !course.id) return;
    navigate(`/apply?courseId=${encodeURIComponent(course.id)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold">Loading course catalog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-accent" />
          Course Recommendations
        </h1>
        <p className="text-gray-500">
          Based on your APS score of <span className="font-bold text-primary">{apsScore}</span>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="input-field pl-10 pr-8 appearance-none"
              >
                {fields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="input-field pl-10 pr-8 appearance-none"
              >
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Field Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {fields.filter(f => f !== 'All').map(field => (
          <button
            key={field}
            onClick={() => setSelectedTag(selectedTag === field ? 'All' : field)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTag === field
                ? 'bg-accent text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-accent hover:text-accent'
            }`}
          >
            {field}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => {
          const courseUniversities = getUniversitiesForCourse(course);
          const qualifies = apsScore >= course.minAps;

          return (
            <div key={course.id} className={`card hover:shadow-md transition-all ${qualifies ? 'border-l-4 border-l-accent' : 'border-l-4 border-l-gray-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <span className="badge-accent">{course.field}</span>
                {qualifies ? (
                  <CheckCircle2 className="w-5 h-5 text-accent" title="You qualify" />
                ) : (
                  <div className="relative group">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg mb-2">{course.name}</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>Min APS: <strong className={qualifies ? 'text-accent' : 'text-red-500'}>{course.minAps}</strong></span>
                </div>
              </div>
              <button
                disabled={!qualifies}
                onClick={() => handleApply(course)}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  qualifies ? 'bg-accent text-white hover:bg-teal-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {qualifies ? 'Apply Now' : 'APS Too Low'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}