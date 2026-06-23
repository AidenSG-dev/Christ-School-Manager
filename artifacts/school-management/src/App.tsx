import React, { createContext, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginScreen } from "./components/auth/LoginScreen";
import { OnboardingScreen } from "./components/auth/OnboardingScreen";
import { Header } from "./components/Header";
import { StudentInfo } from "./components/student/StudentInfo";
import { MarksRegistry } from "./components/marks/MarksRegistry";
import { LessonPlan } from "./components/lesson/LessonPlan";

export const AppContext = createContext<any>(null);

function AppContent() {
  const { session, profile, loading, signOut } = useAuth();

  const [academicYear, setAcademicYear] = useState<string | null>(
    () => localStorage.getItem("christSchool_academicYear")
  );
  const [activeTab, setActiveTab] = useState("Student Info");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSetYear = (year: string) => {
    setAcademicYear(year);
    if (year) localStorage.setItem("christSchool_academicYear", year);
    else localStorage.removeItem("christSchool_academicYear");
  };

  // 1. Auth loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-secondary font-bold tracking-widest text-sm animate-pulse">LOADING…</div>
      </div>
    );
  }

  // 2. Not authenticated
  if (!session) return <LoginScreen />;

  // 3. Authenticated but no profile — first-time onboarding
  if (!profile) return <OnboardingScreen />;

  // 4. Fully authenticated — show app
  return (
    <AppContext.Provider value={{ academicYear }}>
      <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
        <Header
          academicYear={academicYear}
          setAcademicYear={handleSetYear}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          teacherName={profile.teacher_name}
          subject={profile.subject}
          onSignOut={signOut}
        />

        <main className="flex-1 flex overflow-hidden relative">
          {!academicYear ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-8 bg-white border border-border shadow-sm max-w-md">
                <h2 className="text-xl font-bold text-secondary mb-2 tracking-tight">SYSTEM LOCKED</h2>
                <p className="text-gray-600 text-sm">
                  Select an Academic Year from the header to initialize the administration matrix.
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "Student Info" && (
                <StudentInfo sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              )}
              {activeTab === "Marks Registry" && (
                <MarksRegistry sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              )}
              {activeTab === "Lesson Plan" && (
                <LessonPlan sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              )}
            </>
          )}
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
