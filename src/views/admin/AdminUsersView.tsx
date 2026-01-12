import React, { useState } from "react";
import { useAdminUsers } from "../../hooks/admin/useAdminUsers";
import { useAdminActions } from "../../hooks/admin/useAdminActions";
import { Search, Shield, ShieldAlert, CheckCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OptimizedImage from "../../components/OptimizedImage";
import { useAppStore } from "../../store/useAppStore";
import dayjs from "dayjs";

const AdminUsersView: React.FC = () => {
    const { showToast } = useAppStore();
    const [search, setSearch] = useState("");
    const { data, fetchNextPage, hasNextPage } = useAdminUsers(search);
    const { verifyUser, restrictUser, deleteUser } = useAdminActions();

    const users = data?.pages.flat() || [];

    const handleVerify = (id: string, currentStatus: boolean) => {
        verifyUser({ userId: id, status: !currentStatus }, {
            onSuccess: () => showToast(currentStatus ? "ভেরিফিকেশন রিমুভ করা হয়েছে" : "ইউজার ভেরিফাই করা হয়েছে"),
            onError: (err) => showToast(`Error: ${err.message}`)
        });
    };

    const handleBan = (id: string, currentRole: string) => {
        const newRole = currentRole === 'banned' ? 'user' : 'banned';
        restrictUser({ userId: id, role: newRole }, {
            onSuccess: () => showToast(currentRole === 'banned' ? "ইউজার আনব্যান করা হয়েছে" : "ইউজার ব্যান করা হয়েছে"),
            onError: (err) => showToast(`Error: ${err.message}`)
        });
    };


    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            deleteUser(id, {
                onSuccess: () => showToast("ইউজার ডিলিট করা হয়েছে"),
                onError: (err) => showToast(`Error: ${err.message}`)
            });
        }
    }

    return (
        <div className="p-4 w-full max-w-5xl mx-auto">
            {/* Search Bar */}
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-xl bg-card flex items-center gap-2 flex-grow border border-border transition-all focus-within:ring-2 focus-within:ring-ring/20">
                    <Search className="text-muted-foreground ml-2" size={20} />
                    <Input
                        placeholder="ইউজার খুঁজুন..."
                        className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-base"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto shadow-sm rounded-xl border border-border">
                <table className="w-full text-left border-collapse bg-card">
                    <thead>
                        <tr className="border-b border-border text-xs uppercase font-bold text-muted-foreground">
                            <th className="p-4">User</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="relative">
                                        <OptimizedImage src={user.avatar_url || ""} className="w-10 h-10 rounded-full border border-border" alt={user.username} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">{user.username}</div>
                                        <div className="text-xs text-muted-foreground">{user.full_name}</div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {user.is_verified && <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider">Verified</span>}
                                        {user.role === 'admin' && <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-wider">Admin</span>}
                                        {user.role === 'banned' && <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-wider">Banned</span>}
                                        {user.role === 'user' && !user.is_verified && <span className="text-muted-foreground text-xs font-bold">Active</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-muted-foreground font-bold">
                                    {dayjs(user.updated_at).format('DD MMM, YYYY')}
                                </td>
                                <td className="p-4 flex items-center justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleVerify(user.id, user.is_verified || false)}
                                        className={`${user.is_verified ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground"} hover:bg-blue-500/20 h-9 w-9 rounded-lg`}
                                        title={user.is_verified ? "Unverify" : "Verify"}
                                    >
                                        <CheckCircle size={18} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleBan(user.id, user.role)}
                                        className={`${user.role === 'banned' ? "text-destructive bg-destructive/10" : "text-muted-foreground"} hover:bg-destructive/20 h-9 w-9 rounded-lg`}
                                        title={user.role === 'banned' ? "Unban" : "Ban"}
                                    >
                                        {user.role === 'banned' ? <Shield size={18} /> : <ShieldAlert size={18} />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-lg"
                                        onClick={() => handleDelete(user.id)}
                                        title="Delete User"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="p-4 rounded-2xl border border-border bg-card shadow-sm active:scale-[0.98] transition-transform"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <OptimizedImage src={user.avatar_url || ""} className="w-12 h-12 rounded-full border border-border shadow-sm" alt={user.username} />
                                <div>
                                    <div className="font-bold text-base text-foreground">{user.username}</div>
                                    <div className="text-xs text-muted-foreground font-medium">{user.full_name}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {user.is_verified && <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-wider">Verified</span>}
                                {user.role === 'admin' && <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[9px] font-black uppercase tracking-wider">Admin</span>}
                                {user.role === 'banned' && <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-wider">Banned</span>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-dashed border-border pt-4">
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                joined {dayjs(user.updated_at).format('DD MMM YY')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleVerify(user.id, user.is_verified || false)}
                                    className={`rounded-full px-3 h-8 text-[11px] font-black transition-all ${user.is_verified ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                                >
                                    {user.is_verified ? "Unverify" : "Verify"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleBan(user.id, user.role)}
                                    className={`rounded-full px-3 h-8 text-[11px] font-black transition-all ${user.role === 'banned' ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
                                >
                                    {user.role === 'banned' ? "Unban" : "Ban"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                                    onClick={() => handleDelete(user.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {hasNextPage && (
                <div className="mt-8 text-center">
                    <Button variant="outline" className="rounded-full px-10 font-black border-border hover:bg-accent text-xs uppercase tracking-widest transition-all hover:scale-105" onClick={() => fetchNextPage()}>
                        আরো দেখুন
                    </Button>
                </div>
            )}
        </div>
    );
}

export default AdminUsersView;
