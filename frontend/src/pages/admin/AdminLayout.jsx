import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users } from 'lucide-react';
import './AdminLayout.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/reports', label: 'Reports', icon: ClipboardList },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  return (
    <div className="admin-layout page-wrapper">
      <div className="container admin-layout__inner">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__title">Admin Panel</div>
          <nav className="admin-sidebar__nav">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                id={`admin-nav-${n.label.toLowerCase()}`}
                className={({ isActive }) => `admin-sidebar__link ${isActive ? 'active' : ''}`}
              >
                <n.icon size={15} /> {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
