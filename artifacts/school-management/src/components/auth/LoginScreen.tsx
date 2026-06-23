import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import schoolLogo from "@assets/image_1782145199279.png";

type Mode = "login" | "signup";

export const LoginScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo("Account created! Check your email to confirm, then log in.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Top bar matching app header */}
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

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white border border-border shadow-md w-full max-w-sm">
          <div className="border-t-4 border-primary" />
          <div className="p-8">
            <h2 className="text-xl font-bold text-primary mb-1">
              {mode === "login" ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">School Management System</p>

            {/* Google */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 border border-border py-2.5 font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-gray-400 font-semibold">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email / Password */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Email</label>
                <input
                  type="email" required autoComplete="email"
                  className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Password</label>
                <input
                  type="password" required autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  value={password} onChange={e => setPassword(e.target.value)}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-600 px-3 py-2 text-sm text-red-700 font-semibold">
                  {error}
                </div>
              )}
              {info && (
                <div className="bg-green-50 border-l-4 border-green-600 px-3 py-2 text-sm text-green-700 font-semibold">
                  {info}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-primary text-white font-bold py-2.5 text-sm hover:bg-secondary transition-colors disabled:opacity-60"
              >
                {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="mt-4 text-center">
              {mode === "login" ? (
                <p className="text-sm text-gray-500">
                  No account?{" "}
                  <button onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
                    className="text-primary font-bold hover:underline">
                    Create one
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setError(null); setInfo(null); }}
                    className="text-primary font-bold hover:underline">
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
