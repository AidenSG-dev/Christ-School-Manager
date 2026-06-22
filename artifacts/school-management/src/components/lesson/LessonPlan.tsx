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
    setLessonData(prev => ({
      ...prev,
      [`${day}_${period}`]: value
    }));
  };

  return (
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-[30%] bg-white border-r border-border flex flex-col h-full absolute md:relative z-10 overflow-y-auto`}>
        <div className="p-4 border-b border-border bg-gray-50">
          <h2 className="font-bold text-secondary">LESSON PLANS</h2>
        </div>
        <div className="p-2 space-y-1">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setActiveClassId(c.id);
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 font-semibold transition-colors ${
                activeClassId === c.id 
                  ? 'bg-blue-50 border-l-4 border-accent text-primary' 
                  : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'
              }`}
            >
              {c.name} {c.section}
            </button>
          ))}
          {classes.length === 0 && (
            <div className="text-gray-400 text-sm text-center py-8">No classes added yet.</div>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="w-full md:w-[70%] h-full flex flex-col bg-gray-50 overflow-hidden">
        {activeClass ? (
          <div className="flex flex-col h-full overflow-hidden bg-white">
            <div className="p-4 border-b border-border bg-gray-50 shrink-0">
              <div className="font-bold text-lg text-primary tracking-tight">
                Weekly Planner <span className="mx-2 text-gray-300">|</span> Class: {activeClass.name} {activeClass.section}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full border-collapse bg-white table-fixed">
                <thead>
                  <tr>
                    <th className="excel-header w-24 text-center border-r border-gray-600">Period</th>
                    {days.map(day => (
                      <th key={day} className="excel-header border-r border-gray-600 text-center">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period} className="hover:bg-blue-50/30">
                      <td className="excel-cell bg-gray-50 text-center font-bold text-gray-700 h-16">
                        {period}
                      </td>
                      {days.map(day => (
                        <td key={day} className="excel-cell relative">
                          <textarea
                            className="absolute inset-0 w-full h-full p-2 outline-none border-2 border-transparent focus:border-accent resize-none text-sm leading-tight bg-transparent"
                            value={lessonData[`${day}_${period}`] || ""}
                            onChange={(e) => updateLesson(day, period, e.target.value)}
                            placeholder="Enter topic..."
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a class from the sidebar to plan lessons.
          </div>
        )}
      </div>
    </div>
  );
};
