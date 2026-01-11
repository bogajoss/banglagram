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
  Instagram,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import OptimizedImage from "../OptimizedImage";

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
          <Link
            to="/"
            className={`text-2xl font-bold tracking-wide italic text-[#006a4e] block transition-all duration-300 ${isSidebarExpanded ? "opacity-100" : "opacity-0 hidden"}`}
          >
            Banglagram
          </Link>
          {!isSidebarExpanded && (
            <Link to="/" className="text-[#006a4e]">
              <Instagram size={28} />
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
          <motion.div
            whileHover={{ scale: 1.02, x: isSidebarExpanded ? 5 : 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCreateModalOpen(true)}
            className={`flex items-center ${isSidebarExpanded ? "gap-4 px-3" : "justify-center"} py-3 rounded-lg transition-colors cursor-pointer group ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
          >
            <div className="relative">
              <PlusSquare size={24} />
            </div>
            {isSidebarExpanded && (
              <span className="text-base truncate">তৈরি করুন</span>
            )}
          </motion.div>

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
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className={`flex items-center ${isSidebarExpanded ? "gap-4 px-3" : "justify-center"} py-3 rounded-lg transition-colors cursor-pointer ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
        >
          {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
          {isSidebarExpanded && <span className="text-base">থিম পরিবর্তন</span>}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleSidebar}
          className={`flex items-center ${isSidebarExpanded ? "gap-4 px-3" : "justify-center"} py-3 rounded-lg transition-colors cursor-pointer ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
        >
          {isSidebarExpanded ? (
            <PanelLeftClose size={24} />
          ) : (
            <PanelLeftOpen size={24} />
          )}
          {isSidebarExpanded && <span className="text-base">বন্ধ করুন</span>}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signOut()}
          className={`flex items-center ${isSidebarExpanded ? "gap-4 px-3" : "justify-center"} py-3 rounded-lg transition-colors cursor-pointer text-red-500 ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
        >
          <LogOut size={24} />
          {isSidebarExpanded && <span className="text-base">লগ আউট</span>}
        </motion.div>
      </div>
    </div>
  );
};

export default Sidebar;
