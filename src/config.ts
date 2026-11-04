import { z } from "zod";

const EnvSchema = z.object({
  PP_CLIENT_ID: z.string().min(1),
  PP_CLIENT_SECRET: z.string().min(1),
});

export const env = EnvSchema.parse(process.env);
