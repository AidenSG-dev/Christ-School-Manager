import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import schoolLogo from "@assets/image_1782145199279.png";

export const OnboardingScreen: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [teacherName, setTeacherName] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !subject.trim()) {
      setError("Both fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("teachers").insert({
      id: user!.id,
      teacher_name: teacherName.trim(),
      subject: subject.trim(),
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    await refreshProfile();
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <div className="bg-secondary h-20 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <img src={schoolLogo} alt="Christ School" className="h-12 w-12 object-contain" />
          <h1
            className="text-3xl font-bold tracking-normal text-white leading-none"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            CHRIST SCHOOL
          </h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white border border-border shadow-md w-full max-w-sm">
          <div className="border-t-4 border-primary" />
          <div className="p-8">
            <h2 className="text-xl font-bold text-primary mb-1">Welcome!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Let's set up your teacher profile before you get started.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">
                  Teacher's Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required autoFocus
                  className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="e.g. Mrs. Sarah John"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required
                  className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="e.g. Computer Science"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-600 px-3 py-2 text-sm text-red-700 font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-primary text-white font-bold py-2.5 text-sm hover:bg-secondary transition-colors disabled:opacity-60"
              >
                {loading ? "Saving…" : "Enter Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
