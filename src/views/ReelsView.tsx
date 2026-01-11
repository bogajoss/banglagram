import React from "react";
import ReelItem from "../components/ReelItem";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import { useGetReels } from "../hooks/queries/useGetReels";
import { useAuth } from "../hooks/useAuth";

const ReelsView: React.FC = () => {
  const { theme, showToast } = useAppStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  const { data: reels = [], isLoading } = useGetReels(user?.id);

  const onUserClick = (user: User) => {
    navigate(`/profile/${user.username}`);
  };

  if (isLoading) {
      return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading reels...</div>;
  }

  if (reels.length === 0) {
      return <div className="h-screen w-full flex items-center justify-center bg-black text-white">No reels yet</div>;
  }

  return (
    <div className="h-screen w-full flex justify-center bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      <div className="w-full md:w-[400px] h-full">
        {reels.map((reel) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            showToast={showToast}
            theme={theme}
            onUserClick={onUserClick}
            glassModal={glassModal}
          />
        ))}
      </div>
    </div>
  );
};

export default ReelsView;
