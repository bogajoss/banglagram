import React, { useState } from "react";
import { X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { motion } from "framer-motion";
import { useUpdateProfile } from "../../hooks/mutations/useUpdateProfile";
import { useAuth } from "../../hooks/useAuth";

import OptimizedImage from "../OptimizedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const EditProfileModal: React.FC = () => {
  const { currentUser, theme, setEditProfileOpen } = useAppStore();
  const { user } = useAuth();
  const { mutate: updateProfileMutation, isPending } = useUpdateProfile();

  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatar(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onClose = () => setEditProfileOpen(false);

  const handleSave = () => {
    if (!user) return;
    updateProfileMutation(
      {
        userId: user.id,
        name,
        bio: bio || "",
        avatar,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

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
        className={`w-full max-w-md rounded-xl overflow-hidden shadow-2xl ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-4 border-b font-bold flex justify-between items-center ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
        >
          <span>এডিট প্রোফাইল</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div
            className={`flex items-center gap-4 p-4 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`}
          >
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <OptimizedImage
                src={avatar}
                className="w-full h-full"
                alt="avatar"
              />
            </div>
            <div>
              <div className="font-semibold text-lg">
                {currentUser.username}
              </div>
              <label className="text-[#006a4e] text-sm font-bold cursor-pointer hover:underline">
                প্রোফাইল ছবি পরিবর্তন করুন
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>নাম</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label>বায়ো</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-transparent h-24 resize-none"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full bg-[#006a4e] hover:bg-[#00523c] text-white font-bold"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "সেভ করুন"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditProfileModal;
