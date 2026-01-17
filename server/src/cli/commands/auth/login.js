import { cancel, confirm, intro, outro, isCancel } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";
import prisma from "../../../lib/db.js";
import { isTokenExpired, clearToken, saveToken, getToken, requireAuth } from "../../../lib/token.js";
dotenv.config();

const URL = "http://localhost:3005"; //BAckend url

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const CONFIG_DIR = path.join(os.homedir(), ".credentials");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");





export async function LoginAction(opts) {
    const options = z.object({
        serverUrl: z.string().optional(),
        clientId: z.string().optional(),
    })

    const serverUrl = options.serverUrl || URL;
    const clientId = options.clientId || CLIENT_ID;

    intro(chalk.bold("🔒 Better auth CLI Login"))

    const existingToken = await getToken();

    const expiredToken = await isTokenExpired();

    if (existingToken && !expiredToken) {
        const shouldReauth = await confirm({
            message: "Do you want to re-authenticate?",
            initialValue: false,
        })

        if (isCancel(shouldReauth) || !shouldReauth) {
            cancel("Login cancelled...");
            process.exit(0);
        }
    }

    const authClient = createAuthClient({
        serverUrl,
        plugins: [deviceAuthorizationClient()],
    })

    const spinner = yoctoSpinner({ text: "Logging in..." });

    spinner.start();

    try {
        const { data, error } = await authClient.device.code({
            client_id: clientId,
            scope: "openid profile email"
        })
        spinner.stop();

        if (error || !data) {
            logger.error(`Failed to login: ${error?.description}`);
            process.exit(1);
        }

        const { device_code, user_code, verification_uri, expires_in, interval = 5, verification_uri_complete } = data;

        console.log(chalk.cyan(`Device Authorization required`));

        const fullVerificationUrl = `${serverUrl}/device?user_code=${user_code}`;
        console.log(`Please visit ${chalk.underline.blue(fullVerificationUrl)} to authorize the app.`);

        console.log(`Enter Code : ${chalk.green(user_code)}`);

        const shouldOpen = await confirm({
            message: "Do you want to open the link?",
            initialValue: true,
        })

        if (shouldOpen === true) {
            await open(fullVerificationUrl);
        }

        console.log(chalk.gray(`Waiting for authorization... (expires in ${expires_in} seconds)`));

        const token = await pollForToken(authClient, device_code, clientId, interval);

        if (token) {
            const saves = await saveToken(token);
            if (!saves) {
                console.log(chalk.red("✗ Failed to save token."));
                console.log(chalk.red("Please re-authenticate."));
                process.exit(1);
            }

            // Fetch the current user session using the token
            try {
                const response = await fetch(`${serverUrl}/api/me`, {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const sessionData = await response.json();
                
                if (sessionData?.user) {
                    outro(chalk.bold(`🎉 Login successful! Hello ${sessionData.user.name}!`));
                    console.log(chalk.green(`✓ Token saved to ${TOKEN_FILE}`));
                } else {
                    console.log(chalk.green("✓ Login successful!"));
                    console.log(chalk.green(`✓ Token saved to ${TOKEN_FILE}`));
                }
            } catch (err) {
                console.log(chalk.green("✓ Login successful!"));
                console.log(chalk.green(`✓ Token saved to ${TOKEN_FILE}`));
            }
        }

    }
    catch (error) {
        if (error?.message === "access_denied") {
            console.log(chalk.red("\n✗ Authorization Denied"));
            console.log(chalk.yellow("You rejected the device authorization request."));
            console.log(chalk.gray("If you want to login, please approve the authorization next time."));
        } else {
            logger.error(`Failed to login: ${error?.message}`);
        }
        process.exit(1);
    }
}

async function pollForToken(authClient, deviceCode, clientId, initialInterval) {
    let pollingInterval = initialInterval;
    const spinner = yoctoSpinner({ text: "", color: "cyan" });
    let dots = 0;

    return new Promise((resolve, reject) => {
        const poll = async () => {
            dots = (dots + 1) % 4;
            spinner.text = chalk.gray(`Waiting for authorization... ${".".repeat(dots)}`);
            if (!spinner.isSpinning) spinner.start();

            try {
                const { data, error } = await authClient.device.token({
                    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                    device_code: deviceCode,
                    client_id: clientId,
                });

                if (data?.access_token) {
                    spinner.stop();
                    resolve(data); // 👈 This tells the main function to continue
                    return;
                } 
                
                if (error) {
                    if (error.error === "slow_down") pollingInterval += 5;
                    if (["access_denied", "expired_token"].includes(error.error)) {
                        spinner.stop();
                        reject(new Error(error.error));
                        return;
                    }
                    // "authorization_pending" is ignored to keep polling
                }
                
                setTimeout(poll, pollingInterval * 1000);
            } catch (err) {
                spinner.stop();
                reject(err);
            }
        };
        poll();
    });
}


// Comamnd Setup ::
export async function logoutAction() {
    intro(chalk.bold("🔒 CLI Logout"))

    const token = await getToken();
    if (!token) {
        console.log(chalk.yellow("⚠️  You are not logged in."));
        process.exit(0);
    }

    const shouldLogout = await confirm({
        message: "Are you sure you want to logout?",
        initialValue: false,
    })

    if(isCancel(shouldLogout) || !shouldLogout) {
        cancel("Logout cancelled...");
        process.exit(0);
    }

    let cleared = false;
    try {
        cleared = await clearToken();
    }catch(error) {
        console.log(chalk.red("✗ Failed to logout: ", error.message));
        process.exit(1);
    }

    if(cleared) {
        outro(chalk.bold.green("🎉 Successfully logged out!"));
    } else {
        console.log(chalk.red("✗ Failed to logout."));
        process.exit(1);
    }
}

export async function whoamIAction(opts) {
    const token = await getToken();
    
    if (!token || await isTokenExpired()) {
        console.log(chalk.yellow("Session expired or missing. Please run: atom login"));
        process.exit(1);
    }

    if(!token?.access_token){
        console.log(chalk.red("✗ No access token found. Please login first."));
        process.exit(1);
    }

    const user=await prisma.user.findFirst({
        where:{
            sessions:{some:{token:token.access_token}}
        },
        select:{
            id:true,
            name:true,
            email:true,
            image:true,
        }
    });

    console.log(chalk.bold.greenBright(`👤 You are logged in as: ${user?.name}`));
}



export const login = new Command("login")
    .description("Login to your account")
    .option("--serverUrl <serverUrl>", "Server url", URL)
    .option("--clientId <clientId>", "Client id", CLIENT_ID)
    .action(LoginAction);


export const logout = new Command("logout")
    .description("Logout and clear stored credentials")
    .action(logoutAction);


export const whoami = new Command("whoami")
    .description("Display the currently logged in user")
    .action(whoamIAction);
