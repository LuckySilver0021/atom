import dotenv from  "dotenv";

dotenv.config();

export const config={
    googleApiKey:process.env.GOOGLE_GENERATIVE_AI_API_KEY||"",
    groqApiKey:process.env.GROQ_API_KEY||"",
    model:process.env.GROQ_MODEL||"llama-3.3-70b-versatile",
    provider:process.env.AI_PROVIDER||"google", // "google" or "groq"
}
