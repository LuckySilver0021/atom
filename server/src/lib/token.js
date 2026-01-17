import fs from "fs/promises";
import { TOKEN_FILE, CONFIG_DIR } from "../cli/commands/auth/login.js";
import chalk from "chalk";
export async function getToken() {
    try{
        const data=await fs.readFile(TOKEN_FILE,"utf-8");
        const token=JSON.parse(data);
        return token;
    }
    catch(e){
        return null;
    }
}


export async function saveToken(token) {
    try{
        await fs.mkdir(CONFIG_DIR,{recursive:true});

        const tokenData={
            access_token:token.access_token,
            refresh_token:token.refresh_token,
            expires_in:token.expires_in,
            scope:token.scope,
            token_type:token.token_type,
            created_at:token.created_at,
        }
        await fs.writeFile(TOKEN_FILE,JSON.stringify(tokenData,null,2),"utf-8");
        return true;

        }catch(error){
            console.error(chalk.red("Failed to save token: ",error.message));
            return false;
        }
    }


export async function clearToken() {
    try{
        await fs.unlink(TOKEN_FILE);
        return true;
    }
    catch(e){
        return false;
    }
}

export async function isTokenExpired() {
    const token = await getToken();
    if (!token) return true;
    
    // Use created_at + expires_in if expires_at isn't available
    const expiresAt = token.expires_at ? new Date(token.expires_at).getTime() : (token.created_at + (token.expires_in * 1000));
    const now = Date.now();
    
    return (expiresAt - now) < 5 * 60 * 1000;
}

export async function requireAuth() {
    const token = await getToken();
    if (!token || await isTokenExpired()) {
        console.log(chalk.yellow("Session expired or missing. Please run: atom login"));
        process.exit(1);
    }
}