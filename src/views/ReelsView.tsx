import React from "react";
import ReelItem from "../components/ReelItem";
import { useAppStore } from "../store/useAppStore";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { User } from "../types";
import { useGetReels } from "../hooks/queries/useGetReels";
import { useGetReel } from "../hooks/queries/useGetReel";
import { useAuth } from "../hooks/useAuth";

const ReelsView: React.FC = () => {
  const { theme, showToast } = useAppStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  // If ID is provided, we only want that one reel
  const { data: singleReel, isLoading: isLoadingSingle } = useGetReel(id, user?.id);
  const { data: allReels = [], isLoading: isLoadingAll } = useGetReels(user?.id);

  const onUserClick = (user: User) => {
    navigate(`/profile/${user.username}`);
  };

  const isLoading = id ? isLoadingSingle : isLoadingAll;
  const displayReels = id ? (singleReel ? [singleReel] : []) : allReels;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        Loading reel...
      </div>
    );
  }

  if (displayReels.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        {id ? "Reel not found" : "No reels yet"}
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex justify-center bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative">
      {/* Back Button for Mobile */}
      <div 
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-black/40 backdrop-blur-md rounded-full text-white cursor-pointer border border-white/10"
        onClick={() => navigate('/')}
      >
        <ChevronLeft size={28} />
      </div>

      <div className="w-full md:w-[400px] h-full">
        {displayReels.map((reel) => (
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
