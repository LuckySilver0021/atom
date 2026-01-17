#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
import { wakeup } from "./ai/wakeup.js";
dotenv.config();

async function main(){
    console.log(chalk.red(figlet.textSync("Chart CLI",
        {
            font: "standard",
            horizontalLayout: "default",
            
        }
    )));
    console.log(chalk.gray("Chart CLI v1.0.0"));

    const program=new Command("Hellowo lrld");
    program.version("1.0.0").description("Chart CLI v1.0.0")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)
    .addCommand(wakeup);
    
    program.action(()=>{
        program.help();
    })

    program.parse();
}

main().catch((err)=>{
    console.log(chalk.red("This is ",err));
    process.exit(1);
})