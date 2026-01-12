import React, { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import AdminUsersView from "./AdminUsersView";
import AdminPostsView from "./AdminPostsView";
import { Users, Grid, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboardView: React.FC = () => {
    const { theme } = useAppStore();
    const [activeTab, setActiveTab] = useState<'users' | 'content'>('users');

    return (
        <div className={`min-h-screen w-full ${theme === 'dark' ? 'bg-black text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
            {/* Header */}
            <div className={`sticky top-0 z-30 w-full border-b ${theme === 'dark' ? 'border-white/10 bg-black/80' : 'border-black/5 bg-white/80'} backdrop-blur-xl px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                <div className="flex items-center justify-between md:justify-start gap-4">
                    <div className="flex items-center gap-3">
                        <Link to="/" className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-colors`}>
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="bg-red-500/10 p-1.5 rounded-lg">
                                <ShieldCheck className="text-red-500" size={20} />
                            </div>
                            <h1 className="text-lg md:text-xl font-black tracking-tight uppercase">Admin Panel</h1>
                        </div>
                    </div>

                    {/* Breadcrumb or Status indicator - Hidden on very small screens */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Live</span>
                    </div>
                </div>

                <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-xl p-1 self-center md:self-auto w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-white dark:bg-zinc-700 shadow-xl scale-[1.02] text-zinc-950 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                        <Users size={16} /> <span className="md:inline">ইউজার</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'content' ? 'bg-white dark:bg-zinc-700 shadow-xl scale-[1.02] text-zinc-950 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                        <Grid size={16} /> <span className="md:inline">পোস্ট</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full pb-20">
                <div className="max-w-5xl mx-auto px-2 md:px-0">
                    <div className="mt-2 md:mt-4">
                        {activeTab === 'users' ? <AdminUsersView /> : <AdminPostsView />}
                    </div>
                </div>
            </div>

            {/* Mobile Footer Spacing (optional, if we add more fixed nav) */}
        </div>
    );
};

export default AdminDashboardView;
