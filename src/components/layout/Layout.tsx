import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../hooks/useAuth";

const Layout: React.FC = () => {
  const { theme, isSidebarExpanded } = useAppStore();
  const { user } = useAuth();
  const location = useLocation();
  const themeClasses =
    theme === "dark" ? "bg-black text-white" : "bg-white text-black";

  const isMessagesPage = location.pathname.startsWith("/messages");
  const isReelsPage = location.pathname.startsWith("/reels");

  return (
    <div
      className={`min-h-screen font-['Hind_Siliguri'] flex flex-col md:flex-row transition-colors duration-300 ${themeClasses}`}
    >
      {user ? (
        <>
          <Sidebar />
          {!isMessagesPage && !isReelsPage && <MobileNav />}
        </>
      ) : (
        <div className="fixed top-4 right-4 z-[60]">
          <Link
            to="/"
            className="bg-[#006a4e] text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg hover:bg-[#00523c] transition-colors"
          >
            লগ ইন করুন
          </Link>
        </div>
      )}

      <main
        className={`flex-grow ${user ? (isSidebarExpanded ? "md:ml-[245px]" : "md:ml-[72px]") : ""} flex justify-center transition-all duration-300 ${user && !isMessagesPage && !isReelsPage ? "pb-14 md:pb-0" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
