"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import { LogOut, Mail, ShieldCheck } from "lucide-react"; // Added for a premium feel
import { Spinner } from "@/components/ui/spinner";
export default function Home() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !data?.session) {
      router.push("/signin");
    }
  }, [data, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="animate-pulse text-zinc-500 font-medium">
          <Spinner></Spinner>
        </div>
        <Toaster />
      </div>
    );
  }

  if (!data?.session) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 selection:bg-indigo-500/30">
      <div className="w-full max-w-md space-y-6">
        {/* Profile Section */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-zinc-800 to-zinc-700 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <img
                  src={data?.user?.image || "/user.png"}
                  alt="user"
                  className="w-24 h-24 rounded-2xl object-cover ring-1 ring-zinc-700 shadow-inner"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-4 border-zinc-900 shadow-lg" />
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
                  Welcome {data?.user?.name || "User"}
                </h1>
                <div className="flex items-center justify-center gap-1.5 text-zinc-500">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-medium uppercase tracking-wider">Verified Account</span>
                </div>
              </div>

              {/* Email Detail */}
              <div className="w-full mt-8 pt-6 border-t border-zinc-800/50">
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-tight">Email</span>
                    <span className="text-sm text-zinc-300 truncate font-medium">
                      {data?.user?.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="px-2 space-y-4">
          <Button
            variant="ghost"
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => router.push("/signin"),
                },
              })
            }
            className="w-full h-12 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200 flex gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>

          <div className="flex items-center gap-4 px-4">
            <div className="h-px flex-1 bg-zinc-800"></div>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Secure Auth</span>
            <div className="h-px flex-1 bg-zinc-800"></div>
          </div>
        </div>
      </div>
    </div>
  );
}