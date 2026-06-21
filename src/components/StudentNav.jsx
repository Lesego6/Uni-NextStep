import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, Calculator, Building2, BookOpen, FileText, ClipboardList, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function StudentNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: GraduationCap },
    { path: '/calculator', label: 'APS Calculator', icon: Calculator },
    { path: '/universities', label: 'Universities', icon: Building2 },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/apply', label: 'Apply', icon: FileText },
    { path: '/track', label: 'Track', icon: ClipboardList },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 font-heading font-bold text-lg">
            <GraduationCap className="w-6 h-6 text-accent" />
            <span>Uni NextStep</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-white/15 text-accent' : 'hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-gray-300">{user?.name} · {user?.grade}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm hover:text-accent transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-primary border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-white/15 text-accent' : 'hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-white/10 pt-3 mt-2">
              <span className="block px-3 text-sm text-gray-300 mb-2">{user?.name}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:text-red-200">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}