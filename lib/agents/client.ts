import { getGroqClient, retryWithBackoff, safeParseJson, logger } from "@/lib/utils";

export async function runGroqAgent(
  systemInstruction: string,
  promptContent: string,
  responseSchemaDescription: string
): Promise<any> {
  const groq = getGroqClient();
  const fullSystemInstruction = `${systemInstruction}\n\nYou MUST respond with a JSON object that adheres strictly to the following specification:\n${responseSchemaDescription}`;
  
  logger.info(`Running Groq agent with systemInstruction size: ${systemInstruction.length}`);

  return retryWithBackoff(async () => {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: fullSystemInstruction },
        { role: "user", content: promptContent }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const textContent = completion.choices[0]?.message?.content || "{}";
    return safeParseJson(textContent, {});
  });
}
