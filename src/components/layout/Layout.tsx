import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAppStore } from "../../store/useAppStore";

const Layout: React.FC = () => {
  const { theme, isSidebarExpanded } = useAppStore();
  const themeClasses =
    theme === "dark" ? "bg-black text-white" : "bg-white text-black";

  return (
    <div
      className={`min-h-screen font-['Hind_Siliguri'] flex flex-col md:flex-row transition-colors duration-300 ${themeClasses}`}
    >
      <Sidebar />
      <MobileNav />

      <main
        className={`flex-grow ${isSidebarExpanded ? "md:ml-[245px]" : "md:ml-[72px]"} flex justify-center transition-all duration-300 pb-14 md:pb-0`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
