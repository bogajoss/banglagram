import React, { useState } from "react";

import AdminUsersView from "./AdminUsersView";
import AdminPostsView from "./AdminPostsView";
import { Users, Grid, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboardView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'content'>('users');


    return (
        <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
            {/* Header */}
            <div className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center justify-between md:justify-start gap-4">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="p-2 rounded-full hover:bg-accent transition-colors active:scale-90">
                            <ArrowLeft size={20} className="text-foreground" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="bg-destructive/10 p-2 rounded-xl">
                                <ShieldCheck className="text-destructive" size={20} />
                            </div>
                            <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic">Admin Panel</h1>
                        </div>
                    </div>

                    {/* Breadcrumb or Status indicator - Hidden on very small screens */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">System Active</span>
                    </div>
                </div>

                <div className="flex bg-muted/50 backdrop-blur-sm rounded-2xl p-1.5 self-center md:self-auto w-full md:w-auto border border-border/50">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-widest ${activeTab === 'users' ? 'bg-card shadow-lg scale-[1.05] text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Users size={16} /> <span className="md:inline">Users</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-widest ${activeTab === 'content' ? 'bg-card shadow-lg scale-[1.05] text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Grid size={16} /> <span className="md:inline">Posts</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full pb-20 pt-4">
                <div className="max-w-5xl mx-auto px-2 md:px-0">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'users' ? <AdminUsersView /> : <AdminPostsView />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardView;
