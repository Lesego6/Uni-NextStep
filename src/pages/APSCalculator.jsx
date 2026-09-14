import { useState } from 'react';
import { saveAPS } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { subjectList } from '../data/subjects.js';
import { Plus, Trash2, AlertCircle, Calculator, ArrowRight, BookOpen } from 'lucide-react';

// This is kept for UI optimism only. The backend makes the final determination.
function calculateAPSPoints(mark) {
  if (mark >= 80) return 7;
  if (mark >= 70) return 6;
  if (mark >= 60) return 5;
  if (mark >= 50) return 4;
  if (mark >= 40) return 3;
  if (mark >= 30) return 2;
  return 1;
}

export default function APSCalculator() {
  const { setApsScore } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([
    { id: 1, name: 'English Home Language', mark: '', error: '' },
    { id: 2, name: 'Mathematics', mark: '', error: '' },
    { id: 3, name: 'Physical Sciences', mark: '', error: '' },
    { id: 4, name: 'Life Sciences', mark: '', error: '' },
    { id: 5, name: 'History', mark: '', error: '' },
    { id: 6, name: 'Geography', mark: '', error: '' },
    { id: 7, name: 'Life Orientation', mark: '', error: '' },
  ]);

  const [nextId, setNextId] = useState(8);
  // FIX: Implemented component-level error state
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addSubject = () => {
    setSubjects([...subjects, { id: nextId, name: subjectList[0], mark: '', error: '' }]);
    setNextId(nextId + 1);
  };

  const removeSubject = (id) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const updateSubject = (id, field, value) => {
    setFormError('');
    setSubjects(subjects.map(s => {
      if (s.id === id) {
        if (field === 'mark') {
          const num = parseFloat(value);
          let error = '';
          if (value && (num < 0 || num > 100)) {
            error = 'Mark must be between 0 and 100';
          }
          return { ...s, mark: value, error };
        }
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const validSubjects = subjects.filter((s) => {
    const mark = parseFloat(s.mark);
    return !isNaN(mark) && mark >= 0 && mark <= 100 && s.name !== "Life Orientation";
  });

  const totalAPS = validSubjects
    .sort((a, b) => parseFloat(b.mark) - parseFloat(a.mark))
    .slice(0, 6)
    .reduce((sum, s) => sum + calculateAPSPoints(parseFloat(s.mark)), 0);

  const handleSave = async () => {
    setFormError('');
    const rawSubjects = subjects.filter(s => s.mark !== '');
    
    if (rawSubjects.length < 6) {
      setFormError('Please enter marks for at least 6 subjects to calculate a valid APS.');
      return;
    }

    try {
      setIsSaving(true);
      
      // FIX: Format payload for backend server calculation
      const payload = rawSubjects.map(s => ({
        name: s.name,
        percentage: parseFloat(s.mark)
      }));

      const response = await saveAPS(payload);
      
      // Trust backend value over optimistic UI value
      setApsScore(response.aps_score);
      navigate('/courses');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-accent" />
          APS Calculator
        </h1>
        <p className="text-gray-500">Enter your matric subject marks to calculate your Admission Point Score</p>
      </div>

      <div className="card mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Subject</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Mark (%)</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">APS Points</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => {
                const mark = parseFloat(subject.mark);
                const points = !isNaN(mark) && mark >= 0 && mark <= 100 
                  ? (subject.name.toLowerCase().includes("life orientation") ? 0 : calculateAPSPoints(mark)) 
                  : '-';

                return (
                  <tr key={subject.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 px-2">
                      <select
                        value={subject.name}
                        onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white"
                      >
                        {subjectList.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={subject.mark}
                          onChange={(e) => updateSubject(subject.id, 'mark', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                            subject.error 
                              ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                              : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
                          }`}
                        />
                        {subject.error && (
                          <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-red-500 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{subject.error}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center justify-center w-10 h-8 bg-gray-100 rounded-lg text-sm font-bold text-primary">
                        {points}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => removeSubject(subject.id)}
                        disabled={subjects.length <= 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          onClick={addSubject}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-accent hover:text-accent transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      <div className="card bg-gradient-to-r from-primary to-blue-800 text-white border-0 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BookOpen className="w-10 h-10 text-accent" />
            <div>
              <p className="text-blue-200 text-sm">Total Admission Point Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{totalAPS}</span>
                <span className="text-blue-200 text-lg">/ 42</span>
              </div>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-blue-200 text-sm">Subjects entered</p>
            <p className="text-2xl font-bold">{subjects.filter(s => s.mark !== '').length}</p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{formError}</span>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full md:w-auto btn-primary flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : 'Save & See Recommendations'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}