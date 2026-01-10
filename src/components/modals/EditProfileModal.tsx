import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { motion } from 'framer-motion';

const EditProfileModal: React.FC = () => {
    const { currentUser, theme, updateProfile, setEditProfileOpen } = useAppStore();
    const buttonBg = 'bg-[#006a4e] hover:bg-[#00523c]'; 
    const glassModal = theme === 'dark' ? 'bg-[#121212]/90 backdrop-blur-2xl border border-white/10' : 'bg-white/90 backdrop-blur-2xl border border-black/10';

    const [name, setName] = useState(currentUser.name);
    const [bio, setBio] = useState(currentUser.bio);
    const [avatar, setAvatar] = useState(currentUser.avatar);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]){
            const reader = new FileReader();
            reader.onload = (ev) => setAvatar(ev.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    const onClose = () => setEditProfileOpen(false);

    const handleSave = () => {
        updateProfile(name, bio || '', avatar);
        onClose();
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" 
            onClick={onClose}
        >
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className={`w-full max-w-md rounded-xl overflow-hidden shadow-2xl ${glassModal} ${theme === 'dark' ? 'text-white' : 'text-black'}`} 
                onClick={e => e.stopPropagation()}
            >
                <div className={`p-4 border-b font-bold flex justify-between ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
                   <span>এডিট প্রোফাইল</span>
                   <X className="cursor-pointer" onClick={onClose} />
                </div>
                <div className="p-6 flex flex-col gap-4">
                    <div className={`flex items-center gap-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>
                        <img src={avatar} className="w-16 h-16 rounded-full object-cover" alt="avatar" />
                        <div>
                            <div className="font-semibold text-lg">{currentUser.username}</div>
                            <label className="text-[#006a4e] text-sm font-bold cursor-pointer hover:underline">
                                প্রোফাইল ছবি পরিবর্তন করুন
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold mb-1">নাম</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={`w-full p-2 rounded border bg-transparent ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300'}`} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">বায়ো</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className={`w-full p-2 rounded border bg-transparent h-24 resize-none ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300'}`} />
                    </div>

                    <button onClick={handleSave} className={`w-full py-2 rounded-lg text-white font-bold ${buttonBg} mt-2`}>
                        সেভ করুন
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default EditProfileModal;
