import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Calculator, Building2, BookOpen, FileText, ChevronRight, CheckCircle2, Circle, Lock, Award, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const { apsScore, user } = useAuth();

  const steps = [
    { num: 1, label: 'Calculate APS', desc: 'Enter your matric subjects', active: true, path: '/calculator' },
    { num: 2, label: 'Browse Courses', desc: 'Find qualifying courses', active: false, path: '/courses' },
    { num: 3, label: 'Select Universities', desc: 'Choose institutions', active: false, path: '/universities' },
    { num: 4, label: 'Submit Applications', desc: 'Apply to selected courses', active: false, path: '/apply' },
  ];

  const quickNav = [
    { icon: Calculator, label: 'APS Calculator', desc: 'Calculate your score', path: '/calculator', color: 'bg-blue-50 text-primary' },
    { icon: Building2, label: 'Universities', desc: 'Browse all 26 institutions', path: '/universities', color: 'bg-teal-50 text-accent' },
    { icon: BookOpen, label: 'Courses', desc: 'Find matching courses', path: '/courses', color: 'bg-indigo-50 text-indigo-600' },
    { icon: FileText, label: 'Applications', desc: 'Track your status', path: '/track', color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-1">Welcome back, {user?.name?.split(' ')[0] || 'Thabo'}</h1>
        <p className="text-gray-500">Here's your university journey progress</p>
      </div>

      {/* APS Card */}
      <div className="card mb-8 bg-gradient-to-r from-primary to-blue-800 text-white border-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Award className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="text-blue-200 text-sm font-medium">Your APS Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{apsScore}</span>
                <span className="text-blue-200">/ 42</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3">
            <TrendingUp className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm text-blue-200">You qualify for</p>
              <p className="font-bold text-lg">12 courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-6">Your Next Steps</h2>
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.active ? CheckCircle2 : (i === 0 ? Circle : Lock);
            return (
              <div key={step.num} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                step.active ? 'bg-accent/5 border border-accent/20' : 'bg-gray-50 border border-gray-100'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step.active ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.active ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${step.active ? 'text-primary' : 'text-gray-400'}`}>
                    {step.label}
                  </h3>
                  <p className={`text-sm ${step.active ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step.desc}
                  </p>
                </div>
                {step.active ? (
                  <Link to={step.path} className="flex items-center gap-1 text-accent font-semibold text-sm hover:underline">
                    Go <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Lock className="w-4 h-4 text-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickNav.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="card hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-1">{item.label}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}