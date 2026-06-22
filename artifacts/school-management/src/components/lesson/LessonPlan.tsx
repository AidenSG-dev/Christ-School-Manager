import React, { useContext, useState } from "react";
import { AppContext } from "../../App";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { ClassInfo } from "../../types";

interface LessonPlanProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const LessonPlan: React.FC<LessonPlanProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { academicYear } = useContext(AppContext);
  const [classes] = useLocalStorage<ClassInfo[]>(`christSchool_${academicYear}_classes`, []);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  const activeClass = classes.find(c => c.id === activeClassId);
  const keyPrefix = `christSchool_${academicYear}_${activeClassId}_lessons`;
  const [lessonData, setLessonData] = useLocalStorage<Record<string, string>>(keyPrefix, {});

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const updateLesson = (day: string, period: number, value: string) => {
    setLessonData(prev => ({ ...prev, [`${day}_${period}`]: value }));
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-[30%] bg-white border-r border-border h-full absolute md:relative z-20 shrink-0`}
      >
        <div className="h-14 px-4 border-b border-border bg-gray-50 flex items-center shrink-0">
          <h2 className="font-bold text-secondary tracking-wide text-sm">LESSON PLANS</h2>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => { setActiveClassId(c.id); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 font-semibold transition-colors border-l-4 ${
                activeClassId === c.id
                  ? "bg-blue-50 border-l-primary text-primary"
                  : "hover:bg-gray-50 text-gray-700 border-l-transparent"
              }`}
            >
              Class {c.name} – {c.section}
            </button>
          ))}
          {classes.length === 0 && (
            <div className="text-gray-400 text-sm text-center py-8 px-4">
              No classes yet. Add them in Student Info.
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {activeClass ? (
          <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Control row — h-14 matches sidebar */}
            <div className="h-14 px-4 border-b border-border bg-gray-50 flex items-center shrink-0">
              <div className="font-bold text-base text-primary">
                Weekly Planner
                <span className="mx-2 text-gray-300">|</span>
                Class: {activeClass.name} – {activeClass.section}
              </div>
            </div>

            {/* Table — same unified style as grade ledger */}
            <div className="flex-1 overflow-auto p-4">
              <table className="border-collapse bg-white" style={{ width: "max-content", minWidth: "100%" }}>
                <thead>
                  <tr>
                    <th className="excel-header w-24 text-center sticky left-0 z-10">Period</th>
                    {days.map(day => (
                      <th key={day} className="excel-header w-48 text-center">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period} className="hover:bg-indigo-50/20">
                      <td className="excel-cell-fixed bg-gray-50 text-center font-bold text-[#312e81] sticky left-0 z-10 w-24 h-16">
                        Period {period}
                      </td>
                      {days.map(day => {
                        const val = lessonData[`${day}_${period}`] || "";
                        return (
                          <td key={day} className="excel-cell w-48 h-16">
                            <textarea
                              className="absolute inset-0 w-full h-full p-2 outline-none border-2 border-transparent focus:border-accent resize-none text-sm leading-tight bg-transparent"
                              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                              value={val}
                              onChange={e => updateLesson(day, period, e.target.value)}
                              placeholder="Enter topic..."
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a class from the sidebar to plan lessons.
          </div>
        )}
      </div>
    </div>
  );
};
