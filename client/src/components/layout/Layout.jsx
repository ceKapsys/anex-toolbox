import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="min-h-screen bg-[#f6f3f1] p-6">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1400px] rounded-[36px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
