import React from "react";
import schoolLogo from "@assets/image_1782145199279.png";
import { Menu } from "lucide-react";

interface HeaderProps {
  academicYear: string | null;
  setAcademicYear: (year: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  academicYear,
  setAcademicYear,
  activeTab,
  setActiveTab,
  toggleSidebar
}) => {
  const years = ["Select Year", "2024-2025", "2025-2026", "2026-2027", "2027-2028"];
  const tabs = ["Student Info", "Marks Registry", "Lesson Plan"];

  return (
    <header className="bg-secondary text-primary-foreground h-20 flex items-center px-5 shrink-0 justify-between gap-6">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-1" onClick={toggleSidebar}>
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-3">
          <img src={schoolLogo} alt="Christ School Logo" className="h-12 w-12 object-contain" />
          {/* tracking-normal keeps letters bold and compact — not stretched */}
          <h1
            className="text-3xl font-bold tracking-normal text-white leading-none"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            CHRIST SCHOOL
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-blue-100 whitespace-nowrap">Academic Year</label>
          <select
            className="bg-primary border border-blue-300/40 text-white text-sm px-3 py-1.5 outline-none focus:border-accent cursor-pointer"
            value={academicYear || "Select Year"}
            onChange={(e) => setAcademicYear(e.target.value === "Select Year" ? "" : e.target.value)}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <nav className="hidden md:flex items-center gap-1 h-20">
          {tabs.map(tab => {
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
      </div>
    </header>
  );
};
