import { useState } from 'react';
import { universities } from '../data/universities.js';
import { courses } from '../data/courses.js';
import { Building2, MapPin, X, ChevronRight, GraduationCap, Plus } from 'lucide-react';

export default function UniversityBrowser() {
  const [selectedUni, setSelectedUni] = useState(null);

  const getCoursesForUniversity = (uni) => {
    return courses.filter(course => course.universities.includes(uni.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-accent" />
          All 26 SA Universities
        </h1>
        <p className="text-gray-500">Explore South Africa's universities and their offered courses</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {universities.map(uni => (
          <button
            key={uni.id}
            onClick={() => setSelectedUni(uni)}
            className="card text-left hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl font-heading font-bold text-primary group-hover:text-accent transition-colors">
                {uni.abbr}
              </span>
              <span className="badge-primary text-xs">{uni.province}</span>
            </div>
            <h3 className="font-semibold text-sm mb-1">{uni.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              {uni.location}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {uni.courses?.length || 0} courses
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-accent transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedUni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedUni(null)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-4xl font-heading font-bold text-primary">{selectedUni.abbr}</span>
                  <h2 className="text-xl font-bold mt-1">{selectedUni.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedUni(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="badge-primary">{selectedUni.province}</span>
                <span className="badge-accent">{selectedUni.location}</span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-accent" />
                Offered Courses
              </h3>

              {getCoursesForUniversity(selectedUni).length > 0 ? (
                <div className="space-y-3">
                  {getCoursesForUniversity(selectedUni).map(course => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-sm">{course.name}</p>
                        <p className="text-xs text-gray-500">{course.field} · Min APS: {course.minAps}</p>
                      </div>
                      <button className="p-2 rounded-lg bg-accent text-white hover:bg-teal-600 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No courses listed for this university</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}