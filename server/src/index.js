import express from "express";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import prisma from "./lib/db.js";
dotenv.config();

const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}))
app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/api/me",async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.json(null);
        }
        
        const accessToken = authHeader.substring(7);
        
        // Try to verify the token and get the session
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        
        if (session?.user) {
            return res.json(session);
        }
        
        // If no session found, try to find user by token in database
        const tokenRecord = await prisma.session.findFirst({
            where: {
                token: accessToken,
            },
            include: {
                user: true,
            }
        });
        
        if (tokenRecord?.user) {
            return res.json({
                user: tokenRecord.user,
                session: tokenRecord,
            });
        }
        
        return res.json(null);
    } catch (error) {
        console.error("Error in /api/me:", error);
        return res.status(500).json({ error: error.message });
    }
})

app.get("/device",async (req, res)=>{
    const {user_code}=req.query;
    res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
})


app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`);
});

