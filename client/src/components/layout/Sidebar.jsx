import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, FileSpreadsheet, Users, Wrench, ListChecks, Settings, BarChart3, HardDrive, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { version } from '../../../package.json';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/invoices', icon: FileText, label: 'Invoices' },
        { to: '/quotations', icon: FileSpreadsheet, label: 'Quotations' },
        { to: '/clients', icon: Users, label: 'Clients' },
        { to: '/services', icon: Wrench, label: 'Services' },
        { to: '/terms', icon: ListChecks, label: 'Terms' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/backup', icon: HardDrive, label: 'Backup' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Get initials from username or full name
    const getInitials = () => {
        if (user?.full_name) {
            return user.full_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return user?.username?.slice(0, 2).toUpperCase() || 'AD';
    };

    return (
        <aside className="w-72 border-r border-slate-100 bg-[#fbf9f7] px-6 py-7">
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white text-sm font-semibold">№</div>
                <div>
                    <div className="text-sm font-semibold text-slate-800">ANEX Tools</div>
                    <div className="text-xs text-slate-400">Professional Suite</div>
                </div>
            </div>

            <nav className="mt-10 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-white text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.08)]'
                                    : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
                            )
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto pt-10 space-y-2">
                <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {getInitials()}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-slate-400">{user?.email || 'Admin'}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-white/70 hover:text-red-600 transition-all"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </button>
                <p className="text-center text-[10px] text-slate-300 pt-2">v{version}</p>
            </div>
        </aside>
    );
};

export default Sidebar;
