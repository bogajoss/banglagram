import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  PlusSquare,
  Menu,
  Plus,
  Settings,
  Grid,
  Bookmark,
  UserCheck,
  Camera,
  Heart,
  MessageCircle as CommentIcon,
  AtSign,
} from "lucide-react";
import UserListModal from "../components/modals/UserListModal";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import type { User } from "../types";
import { useGetProfile } from "../hooks/queries/useGetProfile";
import { useAuth } from "../hooks/useAuth";
import { useFollowUser } from "../hooks/mutations/useFollowUser";
import { useGetFollows } from "../hooks/queries/useGetFollows";
import { useGetSavedPosts } from "../hooks/queries/useGetSavedPosts";
import { useGetTaggedPosts } from "../hooks/queries/useGetTaggedPosts";
import SettingsModal from "../components/modals/SettingsModal";
import ArchiveModal from "../components/modals/ArchiveModal";
import { supabase } from "../lib/supabaseClient";

import VerifiedBadge from "../components/VerifiedBadge";
import { Button } from "@/components/ui/button";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserStatus } from "../components/UserStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Post } from "../types";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const ProfileView: React.FC = () => {
  const {
    currentUser,
    setViewingPost,
    setEditProfileOpen,
    addStory,
    setCreateModalOpen,
  } = useAppStore();

  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // Determine if it's the current user's profile
  const isMe = !username || username === authUser?.user_metadata?.username;

  const [activeTab, setActiveTab] = useState("posts");
  const [listModalType, setListModalType] = useState<
    "followers" | "following" | null
  >(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const targetUsername =
    username || authUser?.user_metadata?.username || currentUser.username;

  const { data, isLoading, isError } = useGetProfile(
    targetUsername,
    authUser?.id,
  );
  const { mutate: followUser } = useFollowUser();

  const { data: followsList = [], isLoading: followsLoading } = useGetFollows(
    data?.user?.id || "",
    listModalType,
  );

  const { data: realSavedPosts = [] } = useGetSavedPosts(
    isMe ? authUser?.id : undefined,
  );
  const { data: taggedPosts = [] } = useGetTaggedPosts(data?.user?.id);

  const profileUser = data?.user;
  const userPosts = data?.posts || [];

  const userIsFollowing = profileUser?.isFollowing || false;

  React.useEffect(() => {
    if (profileUser?.id && !isMe) {
        supabase.rpc("track_user_interaction", { 
        target_user_id: profileUser.id, 
        interaction_type: "visit" 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any).then(({ error }) => {
        if (error) console.error("Tracking error", error);
      });
    }
  }, [profileUser?.id, isMe]);

  const handleOpenList = (type: "followers" | "following") =>
    setListModalType(type);
  const handleCloseList = () => setListModalType(null);

  const onUserClick = (u: User) => {
    navigate(`/profile/${u.username}`);
  };

  const handleFollow = () => {
    if (!profileUser?.username || !authUser?.id || !profileUser.id) return;

    followUser({
      targetUserId: data?.user?.id || "",
      currentUserId: authUser.id,
      isFollowing: userIsFollowing,
      targetUsername: profileUser.username,
    });

  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        addStory(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading)
    return (
      <div className="w-full max-w-[935px] px-4 md:px-5 py-[30px] space-y-8">
        <header className="flex gap-12 items-center">
          <Skeleton className="w-[150px] h-[150px] rounded-full" />
          <div className="space-y-4 flex-grow">
            <Skeleton className="h-8 w-[200px]" />
            <div className="flex gap-10">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-[300px]" />
          </div>
        </header>
        <div className="grid grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  if (isError || !profileUser)
    return <div className="flex justify-center p-10 text-muted-foreground">Profile not found</div>;

  const renderPostGrid = (posts: Post[]) => {
    if (posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4"
          >
            <Camera size={34} strokeWidth={1} className="text-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-muted-foreground">
            No posts yet
          </h2>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-1 md:gap-8">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative aspect-square group cursor-pointer overflow-hidden"
            onClick={() => setViewingPost(post)}
          >
            <img
              src={post.content.src || post.content.poster}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              alt="post grid"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold z-20">
              <div className="flex items-center gap-2">
                <Heart fill="white" size={20} /> {post.likes}
              </div>
              <div className="flex items-center gap-2">
                <CommentIcon
                  fill="white"
                  size={20}
                  className="-scale-x-100"
                />{" "}
                {post.comments}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[935px] px-0 md:px-5 py-0 md:py-[30px]">
      {listModalType && (
        <UserListModal
          title={listModalType === "followers" ? "Followers" : "Following"}
          users={followsList}
          loading={followsLoading}
          onClose={handleCloseList}
          onUserClick={(u) => {
            onUserClick(u);
            handleCloseList();
          }}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
      {isArchiveOpen && (
        <ArchiveModal onClose={() => setIsArchiveOpen(false)} />
      )}

      <div
        className="md:hidden sticky top-0 z-10 border-b border-border px-4 h-[44px] flex items-center justify-between bg-background/90 backdrop-blur-md"
      >
        <div className="flex items-center gap-1 font-bold text-lg text-foreground">
          {!isMe && (
            <ChevronLeft
              size={24}
              onClick={() => navigate(-1)}
              className="cursor-pointer mr-2"
            />
          )}
          {profileUser.username}
          {profileUser.isVerified && <VerifiedBadge />}
          {isMe && <ChevronDown size={16} />}
        </div>
        <div className="flex gap-6 text-foreground">
          <PlusSquare
            size={24}
            className="cursor-pointer"
            onClick={() => {
              if (isMe) {
                setCreateModalOpen(true);
              }
            }}
          />
          <Menu size={24} className="cursor-pointer" />
        </div>
      </div>
      <header className="flex flex-col md:flex-row gap-6 md:gap-12 mb-4 md:mb-10 items-start md:items-stretch px-4 md:px-0 pt-4 md:pt-0">
        <div className="flex flex-row md:flex-col items-center gap-8 md:gap-0 w-full md:w-auto">
          <div className="flex-shrink-0 md:w-[290px] flex justify-start md:justify-center relative">
            <Avatar className="w-[77px] h-[77px] md:w-[150px] md:h-[150px] border border-border cursor-pointer">
              <AvatarImage src={profileUser.avatar} />
              <AvatarFallback className="text-2xl">{profileUser.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            {isMe && (
              <label className="absolute bottom-0 right-10 md:right-16 bg-[#0095f6] rounded-full p-1 border-2 border-background cursor-pointer">
                <Plus size={16} className="text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleStoryUpload}
                />
              </label>
            )}
          </div>
          <div className="flex md:hidden justify-around flex-grow text-center text-foreground">
            <div className="flex flex-col">
              <span className="font-semibold text-lg">
                {profileUser.stats?.posts || 0}
              </span>
              <span className="text-sm text-muted-foreground">posts</span>
            </div>
            <div
              className="flex flex-col cursor-pointer"
              onClick={() => handleOpenList("followers")}
            >
              <span className="font-semibold text-lg">
                {profileUser.stats?.followers || 0}
              </span>
              <span className="text-sm text-muted-foreground">followers</span>
            </div>
            <div
              className="flex flex-col cursor-pointer"
              onClick={() => handleOpenList("following")}
            >
              <span className="font-semibold text-lg">
                {profileUser.stats?.following || 0}
              </span>
              <span className="text-sm text-muted-foreground">following</span>
            </div>
          </div>
        </div>
        <div className="flex-grow flex flex-col gap-4 w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <h2 className="text-xl font-normal mr-2 hidden md:flex items-center gap-1 text-foreground">
              {profileUser.username}
              {profileUser.isVerified && <VerifiedBadge />}
            </h2>
            <div className="flex gap-2 w-full md:w-auto">
              {isMe ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setEditProfileOpen(true)}
                    className="text-sm font-semibold h-8"
                  >
                    Edit profile
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsArchiveOpen(true)}
                    className="text-sm font-semibold h-8"
                  >
                    View Archive
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleFollow}
                    className={cn("text-sm font-semibold h-8", !userIsFollowing && "bg-[#006a4e] text-white hover:bg-[#00523c]")}
                    variant={userIsFollowing ? "secondary" : "default"}
                  >
                    {userIsFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(`/messages/${profileUser.username}`, {
                        state: { user: profileUser },
                      })
                    }
                    className="text-sm font-semibold h-8"
                  >
                    Message
                  </Button>
                </>
              )}
            </div>
            {isMe && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="hidden md:flex text-foreground"
              >
                <Settings size={24} />
              </Button>
            )}
          </div>
          <div className="hidden md:flex gap-10 text-base text-foreground">
            <span>
              <span className="font-semibold">
                {profileUser.stats?.posts || 0}
              </span>{" "}
              Posts
            </span>
            <span
              className="cursor-pointer"
              onClick={() => handleOpenList("followers")}
            >
              <span className="font-semibold">
                {profileUser.stats?.followers || 0}
              </span>{" "}
              Followers
            </span>
            <span
              className="cursor-pointer"
              onClick={() => handleOpenList("following")}
            >
              <span className="font-semibold">
                {profileUser.stats?.following || 0}
              </span>{" "}
              Following
            </span>
          </div>
          <div className="text-sm px-1 md:px-0 text-foreground">
            <div className="flex items-center gap-2">
              <div className="font-semibold">{profileUser.name}</div>
              {!isMe && (
                <UserStatus
                  isOnline={profileUser.isOnline || false}
                  lastSeen={profileUser.lastSeen || null}
                />
              )}
            </div>
            <div className="flex items-center gap-1 bg-muted w-fit px-2 py-1 rounded-full text-xs text-muted-foreground mt-1 mb-2 cursor-pointer hover:bg-accent">
              <AtSign size={10} /> <span>Threads</span>
            </div>
            <div className="whitespace-pre-wrap">{profileUser.bio || ""}</div>
          </div>
        </div>
      </header>

      {/* Highlights (Only show for me or if user has them - mocking none for others for now) */}
      {isMe && (
        <div className="mb-10 flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0">
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div
              className="w-[64px] h-[64px] md:w-[77px] md:h-[77px] rounded-full border border-border bg-background flex items-center justify-center group-hover:bg-muted transition-colors"
            >
              <div className="w-[60px] h-[60px] md:w-[74px] md:h-[74px] rounded-full border-[2px] border-inherit flex items-center justify-center">
                <PlusSquare
                  size={24}
                  strokeWidth={1}
                  className="text-muted-foreground md:w-8 md:h-8"
                />
              </div>
            </div>
            <span className="text-xs font-semibold text-foreground">New</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-around md:justify-center gap-0 md:gap-12 bg-transparent border-t border-border rounded-none h-auto p-0">
          <TabsTrigger 
            value="posts"
            className="data-[state=active]:border-foreground data-[state=active]:text-foreground border-t-2 border-transparent rounded-none flex items-center gap-2 h-[44px] md:h-[52px] bg-transparent px-0 flex-1 md:flex-none text-xs font-semibold tracking-widest uppercase transition-all shadow-none"
          >
            <Grid size={12} className="md:size-3 size-6" />
            <span className="hidden md:block">Posts</span>
          </TabsTrigger>
          {isMe && (
            <TabsTrigger 
              value="saved"
              className="data-[state=active]:border-foreground data-[state=active]:text-foreground border-t-2 border-transparent rounded-none flex items-center gap-2 h-[44px] md:h-[52px] bg-transparent px-0 flex-1 md:flex-none text-xs font-semibold tracking-widest uppercase transition-all shadow-none"
            >
              <Bookmark size={12} className="md:size-3 size-6" />
              <span className="hidden md:block">Saved</span>
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="tagged"
            className="data-[state=active]:border-foreground data-[state=active]:text-foreground border-t-2 border-transparent rounded-none flex items-center gap-2 h-[44px] md:h-[52px] bg-transparent px-0 flex-1 md:flex-none text-xs font-semibold tracking-widest uppercase transition-all shadow-none"
          >
            <UserCheck size={12} className="md:size-3 size-6" />
            <span className="hidden md:block">Tagged</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          <TabsContent value="posts">
            {renderPostGrid(userPosts)}
          </TabsContent>
          {isMe && (
            <TabsContent value="saved">
              {renderPostGrid(realSavedPosts)}
            </TabsContent>
          )}
          <TabsContent value="tagged">
            {renderPostGrid(taggedPosts)}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ProfileView;
