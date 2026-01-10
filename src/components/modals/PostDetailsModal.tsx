import React, { useState } from 'react';
import { X, Heart, MessageCircle as CommentIcon, Send, Bookmark, Smile, MoreHorizontal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { User, Comment } from '../../types';

const PostDetailsModal: React.FC = () => {
  const { viewingPost, theme, showToast, savedPostIds, toggleSave, setViewingPost } = useAppStore();
  const navigate = useNavigate();

  const [newComment, setNewComment] = useState("");
  // Now we initialize directly from viewingPost and don't need useEffect/useMemo
  // Because we added key={viewingPost.id} in App.tsx, this component will remount when post changes.
  const [localComments, setLocalComments] = useState<Comment[]>(viewingPost?.commentList || []);
  const [liked, setLiked] = useState(false);

  if (!viewingPost) return null;
  const post = viewingPost;
  const isSaved = savedPostIds.has(post.id);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      setLocalComments([...localComments, { user: 'আপনি', text: newComment }]);
      setNewComment("");
    }
  };

  const onClose = () => setViewingPost(null);

  const onUserClick = (user: User) => {
      onClose();
      navigate(`/profile/${user.username}`);
  }

  const glassModal = theme === 'dark' ? 'bg-[#121212]/90 backdrop-blur-2xl border border-white/10' : 'bg-white/90 backdrop-blur-2xl border border-black/10';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in" onClick={onClose}>
       <div 
         className={`w-full max-w-5xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col md:flex-row shadow-2xl ${glassModal} ${theme === 'dark' ? 'text-white' : 'text-black'}`} 
         onClick={e => e.stopPropagation()}
       >
          {/* Media Section */}
          <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:h-auto border-r border-zinc-800 relative">
             <img src={post.content.src || post.content.poster} className="max-h-full max-w-full object-contain" alt="post detail" />
          </div>

          {/* Details Section */}
          <div className="w-full md:w-[400px] flex flex-col h-full md:h-[90vh]">
             <div className={`p-4 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-3" onClick={() => onUserClick(post.user)}>
                   <img src={post.user.avatar} className="w-8 h-8 rounded-full border border-zinc-700 cursor-pointer" alt={post.user.username} />
                   <span className="font-semibold text-sm hover:opacity-70 cursor-pointer">{post.user.username}</span>
                </div>
                <MoreHorizontal size={20} className="cursor-pointer hover:opacity-70" />
             </div>

             <div className="flex-grow overflow-y-auto p-4 space-y-4">
                <div className="flex gap-3">
                   <img src={post.user.avatar} className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer" alt="user" onClick={() => onUserClick(post.user)} />
                   <div className="text-sm">
                      <span className="font-semibold mr-2 cursor-pointer" onClick={() => onUserClick(post.user)}>{post.user.username}</span>
                      <span>{post.caption}</span>
                      <div className="text-xs text-zinc-500 mt-1">{post.time}</div>
                   </div>
                </div>
                {localComments.map((c, i) => (
                   <div key={i} className="flex gap-3 animate-fade-in-up">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#006a4e] to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                         {c.user[0].toUpperCase()}
                      </div>
                      <div className="text-sm">
                         <span className="font-semibold mr-2">{c.user}</span>
                         <span>{c.text}</span>
                      </div>
                   </div>
                ))}
             </div>

             <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-4">
                      <Heart size={24} className={`cursor-pointer hover:opacity-70 transition-transform active:scale-90 ${liked ? 'fill-[#f42a41] text-[#f42a41]' : ''}`} onClick={() => setLiked(!liked)} />
                      <CommentIcon size={24} className="-scale-x-100 cursor-pointer hover:opacity-70" />
                      <Send size={24} className="cursor-pointer hover:opacity-70" onClick={() => showToast('শেয়ার করা হয়েছে')} />
                   </div>
                   <Bookmark size={24} className={`cursor-pointer hover:opacity-70 ${isSaved ? 'fill-current' : ''}`} onClick={() => toggleSave(post.id)} />
                </div>
                <div className="font-semibold text-sm mb-2">{liked ? 'Like count hidden' : post.likes + ' লাইক'}</div>
                <div className="text-xs text-zinc-500 uppercase mb-3">{post.time} আগে</div>
                
                <form onSubmit={handleAddComment} className="flex items-center gap-2 border-t pt-3 border-zinc-800">
                   <Smile size={24} className="text-zinc-400 cursor-pointer hover:text-zinc-200" />
                   <input 
                     type="text" 
                     placeholder="কমেন্ট যোগ করুন..." 
                     className="bg-transparent text-sm w-full outline-none"
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                   />
                   <button 
                     type="submit" 
                     className="text-[#006a4e] text-sm font-semibold disabled:opacity-50 hover:text-[#004d39]" 
                     disabled={!newComment}
                   >
                      পোস্ট
                   </button>
                </form>
             </div>
          </div>
       </div>
       <button className="absolute top-4 right-4 text-white md:hidden p-2 bg-black/50 rounded-full" onClick={onClose}><X size={24} /></button>
    </div>
  );
}

export default PostDetailsModal;
