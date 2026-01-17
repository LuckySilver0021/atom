"use client";
import { authClient } from "@/lib/auth-client";
import React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";


const DeviceAuth = () => {
    const [userCode, setUserCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const handleSubmit=async(e:React.FormEvent)=>{
        e.preventDefault();
        setError(null);
        setLoading(true);

        try{
            const formattedCode = userCode.trim().replace(/-/g, "").toUpperCase();

            const response=await authClient.device({
                query:{
                    user_code:formattedCode,
                }
            })
            if(response.data){
                router.push(`/approve?user_code=${formattedCode}`)
            }
        }
        catch(error){
            setError("Invalid device code");
        }
        finally{
            setLoading(false);
        }
    }

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value =e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if(value.length>4){
            value=value.slice(0,4)+"-"+value.slice(4,8)
        }
        setUserCode(value);
    }
    return (
        <div className="min-h-screenflex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="p-3 rounded-lg border-2 border-dashed border-zinc-700">
                        <ShieldAlert className="w-8 h-8 text-yellow-300" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Device Authorization</h1>
                        <p className="text-muted-foreground">
                            Enter your device code to authorize this device
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="border-2 border-dashed border-zinc-700 rounded-xl p-8 bg-zinc-950 backdrop-blur-sm">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">Device Code</label>
                            <input type="text" id="code" value={userCode} onChange={handleCodeChange} placeholder="XXXX-XXXX" maxLength={9} className="w-full py-3  bg-zinc-900 border-dashed border-zinc-700 rounded-lg"/>
                            <p className="text-xs text-muted-foreground mt-2">
                                Find this code on the device you want to authorize
                            </p>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" disabled={loading || userCode.length<9} className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-300">
                            {loading ? "Verifying..." : "Continue"}
                        </button>

                        <div>
                            <p>This cpde is  unique to your device and will expire shortly. Keep it confidential and never share it with anyone</p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default DeviceAuth;