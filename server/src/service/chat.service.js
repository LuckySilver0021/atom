import prisma from "../lib/db.js";

export class ChatService {
    /*
    *@param {string} userId
    *@param  {string} mode
    *@param {string} title
    * */

    async createConversation(userId, mode = "chat", title = null) {
        return prisma.conversation.create({
            data: {
                userId,
                model: mode,
                title: title || `New ${mode} conversation`,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });
    }
    /* *@param {string} userId
    *@param {string} conversationId
    *@param {string} mode
    */

    async getConversations(userId, conversationId = null, mode = "chat") {
        if (conversationId) {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId,
                },
                include: {
                    messages: {
                        orderBy: { createdAt: "asc" }
                    },
                }
            });
            if (conversation) {
                return conversation;
            }
            return await this.createConversation(userId, mode);
        }
        // If no conversationId, create a new conversation
        return await this.createConversation(userId, mode);
    }

    /** Add message to conversation
     * @param {string} conversationId
     * @param {string} role
     * @param {string | object} content
     *
    */

    async addMessage(conversationId, role, content){
            //Converts content to string if it's an object
            const contentStr = typeof content === "string" ? content : JSON.stringify(content);

            return prisma.message.create({
                data: {
                    conversationId,
                    role,
                    content: contentStr,
                }
            });
        }

        /*
        @param {string} conversationId
        */
        async getMessages(conversationId) {
    const messages = await prisma.message.findMany({
        where: {
            conversationId
        },
        orderBy: { createdAt: "asc" }
    });

    return messages.map((msg) => ({
        ...msg
    })); 
}

/* Get all conversations for a user
*@param {string} userId
*/
async getUserConversations(userId) {
    return prisma.conversation.findMany({
        where: {
            userId
        },
        orderBy: { updatedAt: "desc" },
        include: {
            messages: {
                take: 1,
                orderBy: { createdAt: "desc" }
            }
        }
    });
}


/* Delete a conversation
* @param {string} conversationId
* @param {string} userId
*/

async deleteConversation(conversationId, userId) {
    return prisma.conversation.deleteMany({
        where: {
            id: conversationId,
            userId
        }
    });
}

/*
* Update conversation title
* @param {string} conversationId
* @param {string} title
*/ 
async updateTitle(conversationId, title) {
    return await prisma.conversation.update({
        where: {
            id: conversationId
        },
        data: {
            title
        }
    });
}



//Parse Content

parseContent(content) {
    try {
        return JSON.parse(content);
    } catch (e) {
        return content;
    }


}


/*
* Format messages for AI model
* @param {Array} messages
*/ 
formatMessagesForAI(messages) {
    return messages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
    }));
}

  
}
    