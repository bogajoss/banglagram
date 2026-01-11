import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Home,
  Search,
  Clapperboard,
  MessageCircle,
  Heart,
  PlusSquare,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import OptimizedImage from "../OptimizedImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Sidebar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    currentUser,
    setCreateModalOpen,
    isSidebarExpanded,
    toggleSidebar,
    unreadNotificationsCount,
    unreadMessagesCount,
  } = useAppStore();
  const { signOut } = useAuth();
  const borderClass = theme === "dark" ? "border-zinc-800" : "border-zinc-200";
  const themeClasses =
    theme === "dark" ? "bg-black text-white" : "bg-white text-black";

  const menuItems = [
    { icon: <Home size={24} />, label: "Home", path: "/" },
    { icon: <Search size={24} />, label: "Explore", path: "/explore" },
    { icon: <Clapperboard size={24} />, label: "Reels", path: "/reels" },
    {
      icon: <MessageCircle size={24} />,
      label: "Messages",
      path: "/messages",
      badge:
        unreadMessagesCount > 0
          ? unreadMessagesCount > 99
            ? "99+"
            : unreadMessagesCount
          : undefined,
    },
    {
      icon: <Heart size={24} />,
      label: "Notifications",
      path: "/notifications",
      badge:
        unreadNotificationsCount > 0
          ? unreadNotificationsCount > 99
            ? "99+"
            : unreadNotificationsCount
          : undefined,
    },
  ];

  return (
    <div
      className={`hidden md:flex flex-col ${isSidebarExpanded ? "w-[245px]" : "w-[72px]"} h-screen fixed border-r ${borderClass} p-4 pb-5 justify-between z-50 transition-all duration-300 ${themeClasses}`}
    >
      <div>
        <div
          className={`mb-8 mt-4 ${isSidebarExpanded ? "px-2" : "flex justify-center"}`}
        >
          {isSidebarExpanded ? (
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain" />
              <h1 className="text-xl font-bold tracking-tight text-[#006a4e]">
                SysMed
              </h1>
            </div>
          ) : (
            <Link to="/" className="flex justify-center items-center">
              <img src="/icon.png" alt="SysMed" className="w-8 h-8 object-contain" />
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-lg transition-colors cursor-pointer group ${isActive ? "font-bold" : ""}`
              }
            >
              {({ isActive }) => (
                <motion.div
                  whileHover={{ scale: 1.02, x: isSidebarExpanded ? 5 : 0 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center ${isSidebarExpanded ? "gap-4 px-3" : "justify-center"} py-3 rounded-lg ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                >
                  <div className="relative">
                    <div className={isActive ? "text-[#006a4e]" : ""}>
                      {item.icon}
                    </div>
                    {item.badge && (
                      <div className="absolute -top-2 -right-2 bg-[#f42a41] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border-2 border-black">
                        {item.badge}
                      </div>
                    )}
                  </div>
                  {isSidebarExpanded && (
                    <span className="text-base truncate">
                      {item.label === "Home"
                        ? "হোম"
                        : item.label === "Explore"
                          ? "এক্সপ্লোর"
                          : item.label === "Reels"
                            ? "রিলস"
                            : item.label === "Messages"
                              ? "মেসেজ"
                              : item.label === "Notifications"
                                ? "নোটিফিকেশন"
                                : item.label}
                    </span>
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}

          {/* Create Button (Modal Trigger) */}
          <Button
            variant="ghost"
            onClick={() => setCreateModalOpen(true)}
            className={cn(
              "flex items-center justify-start w-full gap-4 px-3 py-6 rounded-lg transition-colors cursor-pointer group hover:bg-transparent",
              theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5",
              !isSidebarExpanded && "justify-center px-0"
            )}
            asChild
          >
            <motion.div
              whileHover={{ scale: 1.02, x: isSidebarExpanded ? 5 : 0 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-full flex items-center"
            >
              <div className="relative">
                <PlusSquare size={24} />
              </div>
              {isSidebarExpanded && (
                <span className="text-base truncate ml-4 font-normal">তৈরি করুন</span>
              )}
            </motion.div>
          </Button>

          {/* Profile Link */}
          <NavLink
            to={`/profile/${currentUser.username}`}
            className={({ isActive }) =>
              `block rounded-lg transition-colors cursor-pointer group ${isActive ? "font-bold" : ""}`
            }
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ scale: 1.02, x: isSidebarExpanded ? 5 : 0 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center ${isSidebarExpanded ? "gap-4 px-3" : "justify-center"} py-3 rounded-lg ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
              >
                <OptimizedImage
                  src={currentUser.avatar}
                  alt="Profile"
                  width={100}
                  className={`w-6 h-6 rounded-full ${isActive ? "border-2 border-[#006a4e]" : ""}`}
                />
                {isSidebarExpanded && (
                  <span className="text-base truncate">প্রোফাইল</span>
                )}
              </motion.div>
            )}
          </NavLink>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className={cn(
            "flex items-center justify-start w-full gap-4 px-3 py-6 rounded-lg transition-colors cursor-pointer group hover:bg-transparent",
            theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5",
            !isSidebarExpanded && "justify-center px-0"
          )}
          asChild
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-full flex items-center"
          >
            {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
            {isSidebarExpanded && <span className="text-base ml-4 font-normal">থিম পরিবর্তন</span>}
          </motion.div>
        </Button>

        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className={cn(
            "flex items-center justify-start w-full gap-4 px-3 py-6 rounded-lg transition-colors cursor-pointer group hover:bg-transparent",
            theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5",
            !isSidebarExpanded && "justify-center px-0"
          )}
          asChild
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-full flex items-center"
          >
            {isSidebarExpanded ? (
              <PanelLeftClose size={24} />
            ) : (
              <PanelLeftOpen size={24} />
            )}
            {isSidebarExpanded && <span className="text-base ml-4 font-normal">বন্ধ করুন</span>}
          </motion.div>
        </Button>

        <Button
          variant="ghost"
          onClick={() => signOut()}
          className={cn(
            "flex items-center justify-start w-full gap-4 px-3 py-6 rounded-lg transition-colors cursor-pointer group hover:bg-transparent text-red-500 hover:text-red-600",
            theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5",
            !isSidebarExpanded && "justify-center px-0"
          )}
          asChild
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-full flex items-center"
          >
            <LogOut size={24} />
            {isSidebarExpanded && <span className="text-base ml-4 font-normal">লগ আউট</span>}
          </motion.div>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
