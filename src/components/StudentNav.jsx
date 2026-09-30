import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Bell,
  BookOpen,
  Building2,
  Calculator,
  CheckCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  getStudentNotifications,
  markAllStudentNotificationsRead,
  markStudentNotificationRead,
} from '../services/api.js';

function formatNotificationTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(String(value).replace(' ', 'T'));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationList({ notifications, onNotificationClick }) {
  if (notifications.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-400">
        No notifications yet.
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={() => onNotificationClick(notification)}
          className={`block w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 ${
            notification.is_read ? 'bg-white' : 'bg-accent/5'
          }`}
        >
          <div className="flex items-start gap-2">
            {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">{notification.title}</p>
              {notification.message && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{notification.message}</p>
              )}
              <p className="mt-1 text-[11px] text-gray-400">
                {formatNotificationTime(notification.created_at)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function StudentNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const studentSummary = [user?.name, user?.grade].filter(Boolean).join(' - ');

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: GraduationCap },
    { path: '/calculator', label: 'APS Calculator', icon: Calculator },
    { path: '/universities', label: 'Universities', icon: Building2 },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/documents', label: 'Documents', icon: Upload },
    { path: '/apply', label: 'Apply', icon: FileText },
    { path: '/track', label: 'Track', icon: ClipboardList },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getStudentNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    loadNotifications();

    const intervalId = window.setInterval(loadNotifications, 30000);
    const handleFocus = () => loadNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadNotifications, user]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        const data = await markStudentNotificationRead(notification.id);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } catch {
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, is_read: true } : item
        )));
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    }

    setNotificationsOpen(false);
    setMobileOpen(false);
    navigate(notification.link_path || '/track');
  };

  const markAllRead = async () => {
    try {
      const data = await markAllStudentNotificationsRead();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    }
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative rounded-lg p-2 transition-colors hover:bg-white/10"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-96 overflow-hidden rounded-lg border border-gray-100 bg-white text-gray-700 shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-bold text-primary">Notifications</p>
                    <button
                      type="button"
                      onClick={markAllRead}
                      disabled={unreadCount === 0}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark read
                    </button>
                  </div>
                  <NotificationList notifications={notifications} onNotificationClick={handleNotificationClick} />
                </div>
              )}
            </div>
            <span className="text-sm text-gray-300">{studentSummary || 'Student'}</span>
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
            <div className="rounded-lg bg-white/5">
              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="mx-2 mb-2 overflow-hidden rounded-lg bg-white text-gray-700">
                  <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                    <p className="text-xs font-bold text-primary">Recent</p>
                    <button
                      type="button"
                      onClick={markAllRead}
                      disabled={unreadCount === 0}
                      className="text-xs font-semibold text-primary disabled:opacity-40"
                    >
                      Mark read
                    </button>
                  </div>
                  <NotificationList notifications={notifications.slice(0, 5)} onNotificationClick={handleNotificationClick} />
                </div>
              )}
            </div>
            <div className="border-t border-white/10 pt-3 mt-2">
              <span className="block px-3 text-sm text-gray-300 mb-2">{user?.name || 'Student'}</span>
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
