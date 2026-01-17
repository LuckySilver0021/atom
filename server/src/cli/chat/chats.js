import chalk from "chalk";
import boxen from "boxen";
import {text,isCancel,cancel,intro,outro} from "@clack/prompts";
import {marked} from "marked";
import {markedTerminal} from "marked-terminal";
import { ChatService } from "../../service/chat.service.js";
import { getToken } from "../../lib/token.js";
import prisma from "../../lib/db.js";
import yoctoSpinner from "yocto-spinner";
import {config} from "../../config/google.config.js";
import { AIService } from "../ai/google-service.js";
import { GroqService } from "../ai/groq-service.js";

// Initialize AI service based on provider
let aiService;
if(config.provider === "groq") {
    aiService = new GroqService();
} else {
    aiService = new AIService();
}

marked.use(
  markedTerminal({
    // Styling options for terminal output
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  })
)

const chatService=new ChatService();

async function getUserFromToken(){
    const token=await getToken();
    if(!token.access_token){
        throw new Error("No access token found. Please login first");
    }
    const spinner=yoctoSpinner({text:"Fetching user info..."});
    spinner.start();
    const user=await prisma.user.findFirst({where:{sessions:{some:{token:token.access_token}}}
    });
    if(!user){
        spinner.error("✗ User not found for the given token. Please login again.");
        throw new Error("User not found for the given token. Please login again.");
    }
    spinner.success(`✓Welcome back ${user.name}`);
    return user;

}



async function initConversation(userId,mode="chat",conversationId=null){
    const spinner=yoctoSpinner({text:"Initializing conversation..."});
    spinner.start();
    const conversation=await chatService.getConversations(userId,conversationId,mode);
    spinner.success("✓ Conversation ready.");

    const conversationInfo = boxen(
  [
    chalk.bold.green(`💬 Title: ${conversation.title}`),
    chalk.bold.green(`💬 Mode: ${mode}`),
  ].join("\n"),
  {
    padding: 1,
    margin: { top: 1, bottom: 1 },
    borderStyle: "round",
    borderColor: "cyan",
    title: "💬 Chat Session",
    titleAlignment: "center",
  }
);
    console.log(conversationInfo);

    if(conversation.messages.length>0){
        console.log(chalk.yellow("📝 Previous messages include: "));
    displayMessages(conversation.messages);
    }

    return conversation;
}

function displayMessages(messages){
    messages.forEach((msg)=>{
        if(msg.role==="user"){
            const userBox=boxen(chalk.white(msg.content),{
                padding:1,
                margin:{left:2,bottom:1},
                borderStyle:"round",
                borderColor:"blue",
                title:"👤 You ",
                titleAlignment:"left"
            });
            console.log(userBox);
        }
        else{
            const renderedContent=marked.parse(msg.content);
            const assistantBox=boxen(renderedContent.trim(),{
                padding:1,
                margin:{left:2,bottom:1},
                borderStyle:"round",
                borderColor:"green",
                title:"🤖Assistant",
                titleAlignment:"left"
            })
            console.log(assistantBox);
        }
    })
}

async function saveMessage(conversationId,role,content){
    return await chatService.addMessage(conversationId,role,content)
}

async function getaiResponse(conversationId, userId){
    const spinner=yoctoSpinner({text:"Waiting for AI response..."});
    spinner.start();
    const dbMessages=await chatService.getMessages(conversationId);
    
    // Get previous conversations for context
    const previousConversations = await chatService.getUserConversations(userId);
    let contextMessages = [];
    
    // Add messages from most recent previous conversation as context
    if(previousConversations.length > 1) {
        const mostRecentPrevious = previousConversations[1];  // Skip current, get most recent
        const previousMessages = await chatService.getMessages(mostRecentPrevious.id);
        
        if(previousMessages.length > 0) {
            contextMessages.push({
                role: "system",
                content: `You are a helpful AI assistant. The user has had previous conversations with you. Here's a summary of your last interaction:\n\nConversation: "${mostRecentPrevious.title}"\nRelevant context from previous chat:\n${previousMessages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n\nUse this context to remember details about the user and provide personalized responses.`
            });
        }
    }
    
    const aiResponse=aiService.formatMessagesForAI([...contextMessages, ...dbMessages]);

    let fullResponse="";
    
    let isFirstChunk=true;
    try{
        const result=await aiService.SendMessage(aiResponse,(chunk)=>{
            if(isFirstChunk){
            spinner.stop();
            console.log("\n");
            const header=chalk.green.bold("🤖 Assistant: ");
            console.log(header);
            console.log(chalk.gray("-".repeat(60)));
            isFirstChunk=false;
            }
            fullResponse+=chunk;
        });

        console.log("\n");
        const renderedMarkdown=marked.parse(fullResponse);
        console.log(renderedMarkdown);
        console.log(chalk.gray("-".repeat(60)));
        console.log("\n");
        return result.content;
    }catch(error){
        spinner.stop();
        
        // Check if it's a quota error
        if(error.message && error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
            const quotaBox = boxen(
                chalk.yellow.bold("⚠️  API Quota Reached!\n\n") +
                chalk.white("You've reached your daily API quota limit.\n") +
                chalk.gray("Please wait ~60 seconds for the quota to reset.\n\n") +
                chalk.cyan("Try again shortly..."),
                {
                    padding: 1,
                    margin: 1,
                    borderStyle: "round",
                    borderColor: "yellow",
                    title: "⏳ Rate Limited"
                }
            );
            console.log(quotaBox);
            throw error;
        }
        
        // Generic error handling
        spinner.error("✗ Error getting AI response: "+error.message);
        throw error;
    }
}

async function updateConversationTitle(conversation,userInput,messageCount){
    if(messageCount==1){
        const title=userInput.slice(0,50)+(userInput.length>50 ? "..." : "");
        await chatService.updateTitle(conversation.id,title);
    }
}


async function chatLoop(conversation, userId) {
  const helpBox = boxen(
    `${chalk.gray('• Type your message and press Enter')}\n${chalk.gray('• Markdown formatting is supported in responses')}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray('• Press Ctrl+C to quit anytime')}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    }
  );

  console.log(helpBox);
  while (true) {
    const userInput = await text({
      message: chalk.cyan("📝 Your message:"),
      placeholder: "Type your message here...",

      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty.";
        }
      }
    });

    if (isCancel(userInput) || userInput === "exit") {
      const exitBox=boxen(chalk.green.bold("👋 Exiting chat session. Goodbye!"),{padding:1,margin:1,borderStyle:"round",borderColor:"green"});
      console.log(exitBox);
      process.exit(0);
    }
    


    await saveMessage(conversation.id, "user", userInput);
    const messages=await chatService.getMessages(conversation.id);
    const aiResponse=await getaiResponse(conversation.id, userId);
    await updateConversationTitle(conversation,userInput,conversation.messages.length+1);
    await saveMessage(conversation.id,"assistant",aiResponse);

  }
}


export async function startChat(mode="chat",conversationId=null){
    try{
        intro(boxen(chalk.bold.green(`💬 Starting ${mode} session. Type 'exit' to quit.`),{padding:1,margin:1,borderStyle:"round",borderColor:"green"}));
        const user=await getUserFromToken();
        const conversation=await initConversation(user.id,mode,conversationId);
        await chatLoop(conversation, user.id);

        outro(chalk.green.bold("👋 Chat session ended. Goodbye!"));
    }catch(error){
        console.error(chalk.red("✗ Error starting chat session: ",error.message));
        process.exit(1);
    }
}