import React from "react";
import ReelItem from "../components/ReelItem";
import { useAppStore } from "../store/useAppStore";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Clapperboard } from "lucide-react";
import type { User } from "../types";
import { useGetReels } from "../hooks/queries/useGetReels";
import { useGetReel } from "../hooks/queries/useGetReel";
import { useAuth } from "../hooks/useAuth";

import { Skeleton } from "@/components/ui/skeleton";

const ReelsView: React.FC = () => {
  const { showToast } = useAppStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // If ID is provided, we only want that one reel
  const { data: singleReel, isLoading: isLoadingSingle } = useGetReel(
    id,
    user?.id,
  );
  const {
    data: allReelsData,
    isLoading: isLoadingAll,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useGetReels(user?.id);

  const allReels = React.useMemo(() => {
    if (!allReelsData) return [];
    return allReelsData.pages.flat();
  }, [allReelsData]);


  const onUserClick = (user: User) => {
    navigate(`/profile/${user.username}`);
  };

  const isLoading = id ? isLoadingSingle : isLoadingAll;
  const displayReels = id ? (singleReel ? [singleReel] : []) : allReels;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Skeleton className="w-full md:w-[400px] h-full rounded-none bg-zinc-900" />
      </div>
    );
  }

  if (displayReels.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center">
          <Clapperboard size={40} className="text-zinc-500" />
        </div>
        <p className="text-zinc-400 font-medium">{id ? "Reel not found" : "No reels yet"}</p>
        <button 
          onClick={() => navigate("/")}
          className="text-sm font-bold hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex justify-center bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative">
      {/* Back Button for Mobile */}
      <div
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-black/40 backdrop-blur-md rounded-full text-white cursor-pointer border border-white/10"
        onClick={() => navigate("/")}
      >
        <ChevronLeft size={28} />
      </div>

      <div className="w-full md:w-[400px] h-full">
        {displayReels.map((reel) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            showToast={showToast}
            onUserClick={onUserClick}
          />
        ))}

        {hasNextPage && !id && (
          <div className="h-screen w-full flex items-center justify-center snap-start bg-black">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full border border-white/20 transition-colors"
            >
              {isFetchingNextPage ? "Loading..." : "See more videos"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReelsView;
