import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import prisma from "../../lib/db.js";
import { select } from "@clack/prompts";
import {getToken} from "../../lib/token.js";
import {startChat} from "../chat/chats.js";


const wakeUpAction=async(opts)=>{
    const token=await getToken();
    if(!token.access_token){
        console.log(chalk.red("Not authenticated , please log in first."));
        return;
    }

    const spinner=yoctoSpinner("Fetching user information...").start();

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
    })
    spinner.stop();

    if(!user){
        console.log(chalk.red("User not found, please log in again."));
        return;
    }

    console.log(chalk.greenBright(`Welcome back ${user.name}!.`));

    const choise=await select({
        message:"Select an option to wake up the AI model:",
        options:[
            {value:"chat",
            label:"chat",
            hint:"Simple chat with AI"
            },
            {
                value:"tool",
                label:"tool calling",
                hint:"Chat with tools ie (Google Search, Code Execution)" 
            },
            {
                value:"agent",
                label:"Agentic Mode",
                hint:"Advanced AI (Comming soon...)"
            }
        ]
});

    switch(choise){
        case "chat":
            startChat("chat");
            break;
        case "tool":
            console.log(chalk.green("Tool calling is selected"));
            break;
        case "agent":
            console.log(chalk.green("Agent mode is selected"));
            break;
    }
}



export const wakeup=new Command("wakeup").description("Wake up the AI model for interaction")
.action(wakeUpAction);