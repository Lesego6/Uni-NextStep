import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { subjectList } from '../data/subjects.js';
import { Plus, Trash2, AlertCircle, Calculator, ArrowRight, BookOpen } from 'lucide-react';

function calculateAPSPoints(mark, subjectName) {
  let points = 0;
  if (mark >= 90) points = 8;
  else if (mark >= 80) points = 7;
  else if (mark >= 70) points = 6;
  else if (mark >= 60) points = 5;
  else if (mark >= 50) points = 4;
  else if (mark >= 40) points = 3;
  else if (mark >= 30) points = 2;
  else points = 1;

  if (subjectName === "Life Orientation" && points > 4) {
    points = 4;
  }
  return points;
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

  const totalAPS = subjects.reduce((sum, s) => {
    const mark = parseFloat(s.mark);
    if (!isNaN(mark) && mark >= 0 && mark <= 100) {
      return sum + calculateAPSPoints(mark, s.name);
    }
    return sum;
  }, 0);

  const validSubjects = subjects.filter(s => {
    const mark = parseFloat(s.mark);
    return !isNaN(mark) && mark >= 0 && mark <= 100;
  });

  const handleSave = () => {
    setApsScore(totalAPS);
    navigate('/courses');
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
                  ? calculateAPSPoints(mark, subject.name) 
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

      {/* Total APS */}
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
            <p className="text-2xl font-bold">{validSubjects.length}</p>
          </div>
        </div>
      </div>

      {/* NSC Scale Reference */}
      <div className="card mb-6">
        <h3 className="font-bold mb-3 text-sm">NSC Point Scale</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-xs">
          {[
            { range: '90-100%', pts: 8 },
            { range: '80-89%', pts: 7 },
            { range: '70-79%', pts: 6 },
            { range: '60-69%', pts: 5 },
            { range: '50-59%', pts: 4 },
            { range: '40-49%', pts: 3 },
            { range: '30-39%', pts: 2 },
            { range: '0-29%', pts: 1 },
          ].map(item => (
            <div key={item.pts} className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-bold text-primary">{item.pts} pts</div>
              <div className="text-gray-500">{item.range}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">* Life Orientation is capped at a maximum of 4 points</p>
      </div>

      <button
        onClick={handleSave}
        className="w-full md:w-auto btn-primary flex items-center justify-center gap-2"
      >
        Save & See Recommendations
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}