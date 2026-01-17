"use client";
import Loginform from '@/components/ui/login-form'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react' // Import useEffect
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from "@/components/ui/spinner"

const page = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && data?.session && data.user) {
      router.push("/");
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

  return (
    <div>
      <Loginform></Loginform>
    </div>
  )
}

export default page;