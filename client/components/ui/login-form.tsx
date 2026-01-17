"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { Card, CardContent } from './card';
import { authClient } from '@/lib/auth-client';
import { Github, Terminal, Sparkles } from 'lucide-react';

const LoginForm = () => {
  const router = useRouter();

  return (
    <>
      {/* Full-viewport AMOLED background beyond canvas */}
      <div className="fixed inset-0 bg-[#030303] -z-10" />

      <div className="min-h-screen flex items-center justify-center bg-[#030303] p-6 selection:bg-indigo-500/30 font-sans">
        <div className="w-full max-w-100 flex flex-col gap-10">

          {/* Branding & Agent Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative group">
              <div className="absolute -inset-2 bg-indigo-900/40 rounded-full blur-2xl group-hover:bg-indigo-800/50 transition-all duration-700" />
              <div className="relative p-4 rounded-2xl bg-zinc-900/50 shadow-2xl backdrop-blur-sm">
                <Terminal className="w-7 h-7 text-indigo-600/95 stroke-[1.5]" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-4 h-4 text-indigo-400/80 animate-pulse" />
              </div>
            </div>

            <h1 className="text-3xl font-semibold tracking-tighter text-zinc-100 mb-2">
              <span className="text-indigo-600 font-bold italic tracking-tight">Atom</span>
            </h1>

            <p className="text-zinc-500 text-[13px] font-medium leading-relaxed max-w-70">
              Autonomous orchestrator for code generation, web intelligence, and tool execution.
            </p>
          </div>

          {/* Auth Surface — fully borderless */}
          <div className="relative">
            <Card className="relative bg-[#070707] rounded-[28px] shadow-[0_0_90px_-25px_rgba(0,0,0,1)] overflow-hidden border-0 outline-none">
              <CardContent className="p-10">
                <Button
                  variant="outline"
                  className="w-full h-12 flex gap-3
                             bg-zinc-900/40 text-zinc-400
                             hover:bg-zinc-900 hover:text-zinc-100
                             transition-all duration-500
                             rounded-xl
                             border-0 outline-none ring-0 focus:ring-0 focus:outline-none
                             shadow-inner"
                  onClick={() =>
                    authClient.signIn.social({
                      provider: "github",
                      callbackURL: "http://localhost:3000",
                    })
                  }
                >
                  <Github className="w-4 h-4 opacity-30 group-hover/btn:opacity-100 transition-opacity" />
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase">
                    Initialize Session
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Meta */}
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-2.5">
  {/* Dark green pulse with faster 500ms duration */}
  <div className="w-1.5 h-1.5 rounded-full bg-indigo-900 animate-pulse duration-1000 shadow-[0_0_8px_rgba(6,78,59,0.5)]" />
  
  <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">
    System Ready
  </span>
</div>

            <p className="text-[11px] text-zinc-600 text-center leading-relaxed font-medium">
              After signing in, return to your terminal to continue. <br />
              By authenticating, you agree to our{" "}
              <span className="text-zinc-500 hover:text-indigo-400 transition-colors cursor-pointer underline underline-offset-8 decoration-zinc-800/50">
                Legal Terms
              </span>.
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default LoginForm;
