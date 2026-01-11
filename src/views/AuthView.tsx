import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../store/useAppStore";

export default function AuthView() {
  const { signIn, signUp } = useAuth();
  const { theme, showToast } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await signUp(email, password, {
          username,
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`,
        });
        if (signUpError) throw signUpError;
        showToast("অ্যাকাউন্ট তৈরি হয়েছে! দয়া করে লগইন করুন।");
        setIsLogin(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const containerBg = theme === "dark" ? "bg-black" : "bg-gray-100";
  const cardBg = theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-white shadow";
  const labelColor = theme === "dark" ? "text-zinc-400" : "text-gray-600";
  const inputBg = theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900";

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${containerBg}`}>
      <div className={`relative w-full max-w-md p-8 sm:p-10 rounded-3xl transition-colors duration-300 ${cardBg}`}>
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold italic text-[#006a4e] mb-2 font-billabong">Banglagram</h1>
            <p className={`${labelColor} text-sm mb-8`}>
              {isLogin ? "আপনার অ্যাকাউন্টে লগইন করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className={`font-semibold text-xs ${labelColor} pb-1 block`}>Username</label>
                  <input
                    type="text"
                    placeholder="আপনার ইউজারনেম"
                    className={`w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#006a4e]/50 transition-all ${inputBg}`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={`font-semibold text-xs ${labelColor} pb-1 block`}>Full Name</label>
                  <input
                    type="text"
                    placeholder="আপনার পূর্ণ নাম"
                    className={`w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#006a4e]/50 transition-all ${inputBg}`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className={`font-semibold text-xs ${labelColor} pb-1 block`}>Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                className={`w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#006a4e]/50 transition-all ${inputBg}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={`font-semibold text-xs ${labelColor} pb-1 block`}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#006a4e]/50 transition-all ${inputBg}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className={`text-xs font-semibold ${labelColor} hover:text-[#006a4e] transition-colors`}
                  onClick={() => showToast("পাসওয়ার্ড রিসেট ফিচার শীঘ্রই আসছে")}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-[#006a4e] hover:bg-[#00523c] text-white rounded-xl font-bold text-base shadow-lg transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>প্রসেস হচ্ছে...</span>
                </div>
              ) : (
                isLogin ? "Log In" : "Sign Up"
              )}
            </button>
          </form>

          <div className="my-8 flex items-center justify-between">
            <span className={`w-1/4 border-b ${theme === "dark" ? "border-zinc-800" : "border-gray-200"}`}></span>
            <span className={`text-[10px] uppercase font-bold ${labelColor}`}>বা সামাজিক যোগাযোগ মাধ্যম দিয়ে</span>
            <span className={`w-1/4 border-b ${theme === "dark" ? "border-zinc-800" : "border-gray-200"}`}></span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => showToast("Google লগইন শীঘ্রই আসছে")}
              className={`flex items-center justify-center py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-gray-50 active:scale-95 ${inputBg}`}
            >
              <svg viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M12,5c1.6167603,0,3.1012573,0.5535278,4.2863159,1.4740601l3.637146-3.4699707 C17.8087769,1.1399536,15.0406494,0,12,0C7.392395,0,3.3966675,2.5999146,1.3858032,6.4098511l4.0444336,3.1929321 C6.4099731,6.9193726,8.977478,5,12,5z" fill="#F44336"></path>
                <path d="M23.8960571,13.5018311C23.9585571,13.0101929,24,12.508667,24,12 c0-0.8578491-0.093689-1.6931763-0.2647705-2.5H12v5h6.4862061c-0.5247192,1.3637695-1.4589844,2.5177612-2.6481934,3.319458 l4.0594482,3.204834C22.0493774,19.135437,23.5219727,16.4903564,23.8960571,13.5018311z" fill="#2196F3"></path>
                <path d="M5,12c0-0.8434448,0.1568604-1.6483765,0.4302368-2.3972168L1.3858032,6.4098511 C0.5043335,8.0800171,0,9.9801636,0,12c0,1.9972534,0.4950562,3.8763428,1.3582153,5.532959l4.0495605-3.1970215 C5.1484375,13.6044312,5,12.8204346,5,12z" fill="#FFC107"></path>
                <path d="M12,19c-3.0455322,0-5.6295776-1.9484863-6.5922241-4.6640625L1.3582153,17.532959 C3.3592529,21.3734741,7.369812,24,12,24c3.027771,0,5.7887573-1.1248169,7.8974609-2.975708l-4.0594482-3.204834 C14.7412109,18.5588989,13.4284058,19,12,19z" fill="#00B060"></path>
              </svg>
              <span>Google</span>
            </button>
            <button
              onClick={() => showToast("Apple লগইন শীঘ্রই আসছে")}
              className={`flex items-center justify-center py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-gray-50 active:scale-95 ${inputBg}`}
            >
              <svg viewBox="0 0 30 30" height="20" width="20" xmlns="http://www.w3.org/2000/svg" className={`mr-2 ${theme === "dark" ? "fill-white" : "fill-black"}`}>
                <path d="M25.565,9.785c-0.123,0.077-3.051,1.702-3.051,5.305c0.138,4.109,3.695,5.55,3.756,5.55 c-0.061,0.077-0.537,1.963-1.947,3.94C23.204,26.283,21.962,28,20.076,28c-1.794,0-2.438-1.135-4.508-1.135 c-2.223,0-2.852,1.135-4.554,1.135c-1.886,0-3.22-1.809-4.4-3.496c-1.533-2.208-2.836-5.673-2.882-9 c-0.031-1.763,0.307-3.496,1.165-4.968c1.211-2.055,3.373-3.45,5.734-3.496c1.809-0.061,3.419,1.242,4.523,1.242 c1.058,0,3.036-1.242,5.274-1.242C21.394,7.041,23.97,7.332,25.565,9.785z M15.001,6.688c-0.322-1.61,0.567-3.22,1.395-4.247 c1.058-1.242,2.729-2.085,4.17-2.085c0.092,1.61-0.491,3.189-1.533,4.339C18.098,5.937,16.488,6.872,15.001,6.688z"></path>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          <p className={`mt-8 text-center text-sm ${labelColor}`}>
            {isLogin ? "নতুন অ্যাকাউন্ট দরকার?" : "আগে থেকেই অ্যাকাউন্ট আছে?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="ml-2 text-[#006a4e] font-bold hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
