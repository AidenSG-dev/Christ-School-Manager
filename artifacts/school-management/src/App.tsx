import React, { createContext, useState } from "react";
import { Header } from "./components/Header";
import { StudentInfo } from "./components/student/StudentInfo";
import { MarksRegistry } from "./components/marks/MarksRegistry";
import { LessonPlan } from "./components/lesson/LessonPlan";

export const AppContext = createContext<any>(null);

function AppContent() {
  const [academicYear, setAcademicYear] = useState<string | null>(() => localStorage.getItem('christSchool_academicYear'));
  const [activeTab, setActiveTab] = useState("Student Info");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSetYear = (year: string) => {
    setAcademicYear(year);
    if (year) {
      localStorage.setItem('christSchool_academicYear', year);
    } else {
      localStorage.removeItem('christSchool_academicYear');
    }
  };

  return (
    <AppContext.Provider value={{ academicYear }}>
      <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
        <Header 
          academicYear={academicYear} 
          setAcademicYear={handleSetYear}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 flex overflow-hidden relative">
          {!academicYear ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-8 bg-white border border-border shadow-sm max-w-md">
                <h2 className="text-xl font-bold text-secondary mb-2 tracking-tight">SYSTEM LOCKED</h2>
                <p className="text-gray-600 text-sm">Select an Academic Year from the header to initialize the administration matrix.</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "Student Info" && <StudentInfo sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
              {activeTab === "Marks Registry" && <MarksRegistry sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
              {activeTab === "Lesson Plan" && <LessonPlan sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
            </>
          )}
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return <AppContent />;
}
