import React from 'react';
import { initialData } from '../data/mockData';

interface NotificationsViewProps {
  theme: string;
  buttonBg: string;
  showToast: (msg: string) => void;
  followedUsers: Set<string>;
  toggleFollow: (username: string) => void;
  onUserClick: (user: any) => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ theme, buttonBg, followedUsers, toggleFollow, onUserClick }) => {
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const textSecondary = theme === 'dark' ? 'text-[#a8a8a8]' : 'text-zinc-500';

  return (
    <div className="w-full max-w-[600px] flex flex-col gap-6">
      <div className={`md:hidden sticky top-0 z-10 border-b ${borderClass} p-4 flex items-center ${theme === 'dark' ? 'bg-black/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`}>
         <h1 className="text-xl font-bold">নোটিফিকেশন</h1>
      </div>

      <div className="px-4 md:px-2 py-2 md:py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold px-2 hidden md:block">নোটিফিকেশন</h1>
        <div>
          <h2 className="text-base font-bold mb-4 px-2">আগের</h2>
          <div className="flex flex-col gap-4">
            {initialData.notifications.map((notif: any) => (
               <div key={notif.id} className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                     {notif.type === 'follow' && <div className="relative flex-shrink-0" onClick={() => onUserClick(notif.user)}><img src={notif.user.avatar} className="w-11 h-11 rounded-full object-cover cursor-pointer" alt="user" /></div>}
                     {notif.type === 'system' && <div className={`w-11 h-11 rounded-full border ${borderClass} flex items-center justify-center flex-shrink-0`}><img src="https://www.instagram.com/static/images/activity/meta-logo-pano-manual-padding-notif@2x.png/c2173431433e.png" className="w-6 h-6 object-contain" alt="Meta" /></div>}
                     <div className="text-sm">
                        {notif.user && <span className={`font-semibold cursor-pointer ${theme === 'dark' ? 'hover:text-zinc-300' : 'hover:text-zinc-600'}`} onClick={() => onUserClick(notif.user)}>{notif.user.username}</span>}
                        <span className="ml-1">{notif.text}</span>
                        <span className={`${textSecondary} ml-1`}>{notif.time}</span>
                     </div>
                  </div>
                  {notif.isFollowing ? <button className={`${theme === 'dark' ? 'bg-[#363636]' : 'bg-gray-200 text-black'} px-4 py-1.5 rounded-lg text-sm font-semibold`}>ফলো করছেন</button> : notif.type === 'follow' ? <button className={`${buttonBg} text-white px-4 py-1.5 rounded-lg text-sm font-semibold`}>ফলো</button> : null}
               </div>
            ))}
          </div>
        </div>
        <div className={`border-t ${borderClass} pt-4`}>
          <h2 className="text-base font-bold mb-4 px-2">আপনার জন্য প্রস্তাবিত</h2>
          <div className="flex flex-col gap-4">
             {initialData.suggestedUsers.map((user, index) => (
               <div key={index} className="flex items-center justify-between px-2 hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer" onClick={() => onUserClick(user)}>
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.username} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    <div className="flex flex-col text-sm overflow-hidden">
                      <span className={`font-semibold cursor-pointer truncate ${theme === 'dark' ? 'hover:text-zinc-300' : 'hover:text-zinc-600'}`}>{user.username}</span>
                      <span className={`${textSecondary} truncate`}>{user.name}</span>
                      <span className={`${textSecondary} text-xs truncate`}>{user.subtitle}</span>
                    </div>
                  </div>
                  <button className={`${buttonBg} text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap active:scale-95`} onClick={(e) => { e.stopPropagation(); toggleFollow(user.username); }}>{followedUsers.has(user.username) ? 'ফলো করছেন' : 'ফলো'}</button>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsView;
