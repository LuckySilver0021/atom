
import {google} from "@ai-sdk/google";
import {convertToModelMessages, streamText, toolModelMessageSchema} from "ai";
import {config} from "../../config/google.config.js";
import chalk from "chalk";
export class AIService{
    constructor(){
        if(!config.googleApiKey){
            throw new Error("Google API key is not set in env");
        }

        this.model=google(config.model,{
            apiKey:config.googleApiKey,
        })
    }

    //For sending a message and returning stream reponse
   /** 
    * @param {Array} messages
    *@param {Function} onChunk

    *@param {Object} tools
    *@param {Function} onToolCall
    *@returns {Promise<object>}
    **/
    async SendMessage(messages,onChunk,tools=undefined,onToolCall=null){
        try{
                const streamConfig={
                    model:this.model,
                    messages:messages,
                }
                const result=streamText(streamConfig);

                let fullresponse="";

                for await(const chunk of result.textStream){
                    fullresponse+=chunk;
                    if(onChunk){
                        onChunk(chunk);
                    }
                }

                const fullResult=result;

                return{
                    content:fullresponse,
                    finishResponse:fullResult.finishReason,
                    usage:fullResult.usage,
                }
            
        } catch(error){
            console.error(chalk.red("Error in SendMessage: ",error.message));
        }
    }



    /*
    * Get a non-streaming response
    * @params {Array} messages
    * @params {Object} tools
    * @returns {Promise<string>} 
    *
    */ 
   
    async getmessage(messages,tools=undefined){
        let fullresponse="";
        await this.SendMessage(messages,(chunk)=>{
            fullresponse+=chunk;
        });

        return fullresponse;
    }

    formatMessagesForAI(dbMessages) {
        return dbMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }
}
