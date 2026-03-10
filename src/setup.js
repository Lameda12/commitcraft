import readline from 'readline';
import kleur from 'kleur';
import { setConfig } from './config.js';

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function runSetup() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(kleur.bold().cyan('\n  CommitCraft Setup\n'));
  console.log('  Choose your AI provider:\n');
  console.log('  1) Anthropic (Claude)');
  console.log('  2) OpenAI (GPT-4o)');
  console.log('  3) Ollama (local)\n');

  let choice;
  while (!['1', '2', '3'].includes(choice)) {
    choice = (await prompt(rl, kleur.bold('  Enter choice [1-3]: '))).trim();
  }

  const config = {};

  if (choice === '1') {
    config.provider = 'anthropic';
    config.model = 'claude-sonnet-4-20250514';
    const key = (await prompt(rl, kleur.bold('  Anthropic API key: '))).trim();
    if (!key) { rl.close(); throw new Error('API key is required'); }
    config.apiKey = key;
  } else if (choice === '2') {
    config.provider = 'openai';
    config.model = 'gpt-4o';
    const key = (await prompt(rl, kleur.bold('  OpenAI API key: '))).trim();
    if (!key) { rl.close(); throw new Error('API key is required'); }
    config.apiKey = key;
  } else {
    config.provider = 'ollama';
    const host = (await prompt(rl, kleur.bold('  Ollama host [http://localhost:11434]: '))).trim();
    config.host = host || 'http://localhost:11434';
    const model = (await prompt(rl, kleur.bold('  Model name [llama3]: '))).trim();
    config.model = model || 'llama3';
  }

  rl.close();
  setConfig(config);
  console.log(kleur.green('\n  Config saved! Run commitcraft to generate commit messages.\n'));
}
