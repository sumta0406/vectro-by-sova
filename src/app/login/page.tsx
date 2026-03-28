"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setMessage(error ? error.message : "メールを送信しました。リンクをクリックしてログインしてください。");
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor: "#fff8f0",
        backgroundImage: `
          radial-gradient(ellipse at 0% 0%,    rgba(251, 191, 36, 0.6)   0%, transparent 55%),
          radial-gradient(ellipse at 100% 0%,  rgba(251, 113, 133, 0.55) 0%, transparent 55%),
          radial-gradient(ellipse at 100% 100%, rgba(251, 146, 60, 0.5)  0%, transparent 55%),
          radial-gradient(ellipse at 0% 100%,  rgba(52, 211, 153, 0.45)  0%, transparent 55%)
        `,
      }}
    >
      <div className="relative max-w-md w-full mx-4 p-8 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/70">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Vectro by SOVA</h1>
          <p className="text-sm text-slate-500">メールアドレスを入力してログインリンクを受け取ってください</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-white/80 border border-white/60 text-slate-800 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-orange-400 text-white rounded-lg hover:bg-orange-300 disabled:opacity-40 text-sm font-semibold transition-colors shadow-sm"
          >
            {loading ? "送信中..." : "ログインリンクを送信"}
          </button>
        </form>
        {message && <p className="mt-5 text-sm text-center text-slate-600">{message}</p>}
      </div>
    </div>
  );
}
