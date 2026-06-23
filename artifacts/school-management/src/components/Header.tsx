import React from "react";
import schoolLogo from "@assets/image_1782145199279.png";
import { Menu, LogOut } from "lucide-react";

interface HeaderProps {
  academicYear: string | null;
  setAcademicYear: (year: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  teacherName: string;
  subject: string;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  academicYear,
  setAcademicYear,
  activeTab,
  setActiveTab,
  toggleSidebar,
  teacherName,
  subject,
  onSignOut,
}) => {
  const years = ["Select Year", "2024-2025", "2025-2026", "2026-2027", "2027-2028"];
  const tabs = ["Student Info", "Marks Registry", "Lesson Plan"];

  return (
    <header className="bg-secondary text-primary-foreground h-20 flex items-center px-5 shrink-0 justify-between gap-4">
      {/* Left: logo + title + teacher info */}
      <div className="flex items-center gap-4 min-w-0">
        <button className="md:hidden p-1 shrink-0" onClick={toggleSidebar}>
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-3 shrink-0">
          <img src={schoolLogo} alt="Christ School Logo" className="h-12 w-12 object-contain" />
          <h1
            className="text-3xl font-bold tracking-normal text-white leading-none hidden sm:block"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            CHRIST SCHOOL
          </h1>
        </div>
        {/* Teacher info pill */}
        <div className="hidden md:flex flex-col justify-center ml-2 pl-3 border-l border-blue-300/40 min-w-0">
          <span className="text-white font-bold text-sm leading-tight truncate">{teacherName}</span>
          <span className="text-blue-200 text-xs leading-tight truncate">{subject}</span>
        </div>
      </div>

      {/* Right: year selector + tabs + logout */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-blue-100 whitespace-nowrap hidden sm:block">
            Academic Year
          </label>
          <select
            className="bg-primary border border-blue-300/40 text-white text-sm px-3 py-1.5 outline-none focus:border-accent cursor-pointer"
            value={academicYear || "Select Year"}
            onChange={(e) =>
              setAcademicYear(e.target.value === "Select Year" ? "" : e.target.value)
            }
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <nav className="hidden md:flex items-center gap-1 h-20">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const isDisabled = !academicYear;
            return (
              <button
                key={tab}
                disabled={isDisabled}
                onClick={() => setActiveTab(tab)}
                className={`h-20 px-5 text-sm font-bold tracking-wide transition-colors ${
                  isDisabled
                    ? "opacity-40 cursor-not-allowed text-blue-200"
                    : "cursor-pointer hover:bg-primary/60 text-blue-100"
                } ${isActive ? "border-b-[3px] border-white text-white bg-primary/40" : ""}`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={onSignOut}
          title="Sign out"
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 transition-colors border border-white/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
