import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getConfig } from './config.js';

const SYSTEM_PROMPT = `You are a git commit message generator. Given a git diff, return ONLY a JSON array of exactly 3 commit message strings. Each message must follow the Conventional Commits format: type(scope): description. Keep each message under 72 characters. No markdown, no explanation, no code blocks — just the raw JSON array.`;

function parseMessages(text) {
  const cleaned = text.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
  const arr = JSON.parse(cleaned);
  if (!Array.isArray(arr) || arr.length < 3) throw new Error('Invalid response format');
  return arr.slice(0, 3);
}

export async function generateMessages(diff) {
  const config = getConfig();
  const userPrompt = `Generate 3 conventional commit messages for this git diff:\n\n${diff}`;

  if (config.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: config.apiKey });
    const response = await client.messages.create({
      model: config.model,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return parseMessages(response.content[0].text);
  }

  if (config.provider === 'openai') {
    const client = new OpenAI({ apiKey: config.apiKey });
    const response = await client.chat.completions.create({
      model: config.model,
      max_tokens: 512,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });
    return parseMessages(response.choices[0].message.content);
  }

  if (config.provider === 'ollama') {
    const url = `${config.host}/api/chat`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return parseMessages(data.message.content);
  }

  throw new Error(`Unknown provider: ${config.provider}`);
}
