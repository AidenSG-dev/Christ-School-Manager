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
    <header className="bg-secondary text-primary-foreground h-14 flex items-center px-4 shrink-0 justify-between">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-1" onClick={toggleSidebar}>
          <Menu className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-3">
          <img src={schoolLogo} alt="Logo" className="h-10 w-10 object-contain" />
          <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            CHRIST SCHOOL
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-200">Academic Year</label>
          <select
            className="bg-primary border border-border text-white text-sm px-2 py-1 outline-none focus:border-accent"
            value={academicYear || "Select Year"}
            onChange={(e) => setAcademicYear(e.target.value === "Select Year" ? "" : e.target.value)}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <nav className="hidden md:flex items-center gap-1 h-full">
          {tabs.map(tab => {
            const isActive = activeTab === tab;
            const isDisabled = !academicYear;
            return (
              <button
                key={tab}
                disabled={isDisabled}
                onClick={() => setActiveTab(tab)}
                className={`h-14 px-4 text-sm font-bold transition-colors ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary'
                } ${isActive ? 'border-b-2 border-accent text-white' : 'text-gray-300'}`}
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
