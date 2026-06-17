import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/admin/dashboard',   label: 'Dashboard',   icon: 'DB' },
  { to: '/admin/courses',     label: 'Courses',     icon: 'CR' },
  { to: '/admin/enrollments', label: 'Enrollments', icon: 'EN' },
  { to: '/admin/announcements', label: 'Announcements', icon: 'AN' },
  { to: '/admin/sessions', label: 'Schedule', icon: 'SC' },
  { to: '/admin/profile', label: 'Profile', icon: 'PF' },
];

const studentLinks = [
  { to: '/student/dashboard',   label: 'Dashboard',    icon: 'DB' },
  { to: '/student/courses',     label: 'Courses',      icon: 'CR' },
  { to: '/student/enrollments', label: 'My Courses',   icon: 'MY' },
  { to: '/student/announcements', label: 'Announcements', icon: 'AN' },
  { to: '/student/schedule', label: 'Schedule', icon: 'SC' },
  { to: '/student/ai-chat',     label: 'AI Assistant', icon: 'AI' },
  { to: '/student/profile', label: 'Profile', icon: 'PF' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin() ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-20 md:w-72 h-screen overflow-y-auto bg-white/92 backdrop-blur-md border-r border-slate-200 flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-center md:justify-start md:gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-sm text-white font-bold shadow-sm">
            B
          </div>
          <div className="hidden md:block">
            <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">BinaryStack</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Technologies</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-3 md:px-4 py-4 border-b border-slate-200">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <span className={isAdmin() ? 'badge-admin' : 'badge-student'}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 md:px-3 py-4 space-y-1">
        <p className="hidden md:block text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-3 pb-2">Navigation</p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link justify-center md:justify-start ${isActive ? 'active' : ''}`
            }
          >
            <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
              {link.icon}
            </span>
            <span className="hidden md:inline">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full sidebar-link justify-center md:justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 text-[11px] font-bold flex items-center justify-center">LO</span>
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </aside>
  );
}
