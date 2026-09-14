import { useState, useEffect, useMemo } from "react";
import { getUniversities, getCourses } from "../services/api.js";
import { Building2, MapPin, X, ChevronRight, GraduationCap, Plus, Loader2, Search, AlertCircle } from "lucide-react";

export default function UniversityBrowser() {
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUni, setSelectedUni] = useState(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        const [uniData, courseData] = await Promise.all([
          getUniversities(),
          getCourses()
        ]);
        setUniversities(uniData.universities || []);
        setCourses(courseData.courses || []);
      } catch (err) {
        setError("Failed to load universities from the server.");
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const filteredUniversities = useMemo(() => {
    return universities.filter(uni => 
      uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.abbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.province.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [universities, searchTerm]);

  const getUniCourses = (uniId) => {
    return courses.filter(course => course.universities?.includes(uniId));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold">Loading universities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-accent" />
          University Browser
        </h1>
        <p className="text-gray-500">Explore all 26 South African public universities and their courses.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by university name, abbreviation, or province..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-11"
          />
        </div>
      </div>

      {/* Universities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUniversities.map(uni => {
          const uniCourses = getUniCourses(uni.id);
          
          return (
            <div key={uni.id} className="card hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-lg">
                  {uni.abbr}
                </div>
                <span className="badge-primary bg-gray-100 text-gray-600">{uni.province}</span>
              </div>
              
              <h3 className="font-bold text-lg mb-2 flex-1">{uni.name}</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{uni.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>{uniCourses.length} courses offered</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedUni(uni)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-primary font-semibold hover:border-primary hover:bg-gray-50 transition-all"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {filteredUniversities.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-2">No universities found</h3>
          <p className="text-gray-400">Try adjusting your search terms</p>
        </div>
      )}

      {/* University Details Modal */}
      {selectedUni && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedUni(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-lg">
                    {selectedUni.abbr}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {selectedUni.location}, {selectedUni.province}
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{selectedUni.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedUni(null)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                Available Courses
              </h3>
              
              <div className="space-y-3">
                {getUniCourses(selectedUni.id).length > 0 ? (
                  getUniCourses(selectedUni.id).map(course => (
                    <div key={course.id} className="p-4 rounded-xl border border-gray-100 hover:border-accent/30 hover:bg-accent/5 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-primary mb-1">{course.name}</h4>
                          <p className="text-sm text-gray-500">{course.field}</p>
                        </div>
                        <span className="badge-accent whitespace-nowrap">
                          Min APS: {course.minAps}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No courses listed for this university yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}