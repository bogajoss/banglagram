import React from "react";
import { useAdminPosts } from "../../hooks/admin/useAdminPosts";
import { useAdminActions } from "../../hooks/admin/useAdminActions";
import { Trash2, Heart, MessageCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "../../components/OptimizedImage";
import { useAppStore } from "../../store/useAppStore";
import dayjs from "dayjs";

const AdminPostsView: React.FC = () => {
    const { showToast, setViewingPost } = useAppStore();
    const { data, fetchNextPage, hasNextPage } = useAdminPosts();
    const { deletePost } = useAdminActions();

    const posts = data?.pages.flat() || [];

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this post?")) {
            deletePost(id, {
                onSuccess: () => showToast("পোস্ট ডিলিট করা হয়েছে"),
                onError: (err) => showToast(`Error: ${err.message}`)
            });
        }
    }

    return (
        <div className="p-4 w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="relative aspect-square rounded-xl overflow-hidden border border-border group cursor-pointer bg-card shadow-sm hover:shadow-md transition-all active:scale-95"
                        onClick={() => setViewingPost(post)}
                    >
                        {post.content.type === 'video' ? (
                            <div className="relative w-full h-full">
                                <video src={post.content.src} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                                    <Play size={12} fill="white" className="text-white" />
                                </div>
                            </div>
                        ) : (
                            <OptimizedImage src={post.content.src} className="w-full h-full object-cover" alt="Post" />
                        )}

                        {/* Overlay - Persistent visible parts on mobile for better UX */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 p-3 flex flex-col justify-between text-white">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm p-1 pr-2 rounded-full border border-white/10">
                                    <OptimizedImage src={post.user.avatar || ""} className="w-5 h-5 rounded-full border border-white/20" alt={post.user.username} />
                                    <span className="text-[10px] font-black tracking-tight truncate max-w-[60px] uppercase">{post.user.username}</span>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shadow-xl border border-white/10 active:scale-90 transition-transform"
                                    onClick={(e) => handleDelete(post.id, e)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>

                            <div className="flex flex-col gap-1.5 items-center">
                                <div className="flex justify-center gap-5 text-sm font-black">
                                    <span className="flex items-center gap-1.5 drop-shadow-md"><Heart size={16} fill="currentColor" /> {post.likes}</span>
                                    <span className="flex items-center gap-1.5 drop-shadow-md"><MessageCircle size={16} fill="currentColor" /> {post.comments}</span>
                                </div>
                                <div className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest opacity-80">
                                    {dayjs(post.time).format("DD MMM YYYY")}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {hasNextPage && (
                <div className="mt-12 text-center">
                    <Button variant="outline" className="rounded-full px-12 h-11 font-black border-border hover:bg-accent hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]" onClick={() => fetchNextPage()}>
                        লোড মোর
                    </Button>
                </div>
            )}
        </div>
    );
}

export default AdminPostsView;
