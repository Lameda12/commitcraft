#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process';
import readline from 'readline';
import kleur from 'kleur';
import { getConfig, hasConfig } from './config.js';
import { runSetup } from './setup.js';
import { generateMessages } from './ai.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${kleur.bold().cyan('CommitCraft')} — AI-powered git commit messages

${kleur.bold('Usage:')}
  npx commitcraft           Generate commit messages for staged changes
  npx commitcraft --setup   Re-run the setup wizard
  npx commitcraft --config  Show current provider configuration
  npx commitcraft --help    Show this help message

${kleur.bold('Interactive keys:')}
  1 / 2 / 3   Select a commit message
  e           Edit message manually
  r           Regenerate messages
  q           Quit
`);
  process.exit(0);
}

if (args.includes('--setup')) {
  await runSetup();
  process.exit(0);
}

if (args.includes('--config')) {
  if (!hasConfig()) {
    console.log(kleur.yellow('  No config found. Run: commitcraft --setup'));
  } else {
    const cfg = getConfig();
    console.log(`\n  ${kleur.bold('Provider:')} ${cfg.provider}`);
    console.log(`  ${kleur.bold('Model:')}    ${cfg.model}`);
    if (cfg.host) console.log(`  ${kleur.bold('Host:')}     ${cfg.host}`);
    console.log();
  }
  process.exit(0);
}

// Main flow
if (!hasConfig()) {
  console.log(kleur.yellow('\n  No config found. Starting setup wizard...\n'));
  await runSetup();
}

// Check git repo
try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
} catch {
  console.error(kleur.red('\n  Error: Not inside a git repository.\n'));
  process.exit(1);
}

// Get staged diff
let diff;
try {
  diff = execSync('git diff --staged', { encoding: 'utf8' });
} catch {
  console.error(kleur.red('\n  Error: Failed to run git diff.\n'));
  process.exit(1);
}

if (!diff.trim()) {
  console.log(kleur.yellow('\n  No staged changes found. Run git add <files> first.\n'));
  process.exit(0);
}

async function displayAndPick(messages) {
  console.log(`\n${kleur.bold().cyan('  Suggested commit messages:')}\n`);
  messages.forEach((msg, i) => {
    console.log(`  ${kleur.bold().green(`${i + 1}.`)} ${msg}`);
  });
  console.log(`\n  ${kleur.dim('[1/2/3] pick · [e] edit · [r] regenerate · [q] quit')}\n`);

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.once('keypress', (str, key) => {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(str);
    });

    process.stdin.resume();
  });
}

async function editMessage(defaultMsg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(kleur.bold('  Edit message: '), (answer) => {
      rl.close();
      resolve(answer.trim() || defaultMsg);
    });
    if (defaultMsg) {
      rl.write(defaultMsg);
    }
  });
}

async function main() {
  let messages;

  while (true) {
    if (!messages) {
      process.stdout.write(kleur.dim('  Generating commit messages...\r'));
      try {
        messages = await generateMessages(diff);
        process.stdout.write('                                    \r');
      } catch (err) {
        process.stdout.write('                                    \r');
        console.error(kleur.red(`\n  Error: ${err.message}\n`));
        process.exit(1);
      }
    }

    const key = await displayAndPick(messages);

    if (key === '1' || key === '2' || key === '3') {
      const chosen = messages[parseInt(key) - 1];
      const result = spawnSync('git', ['commit', '-m', chosen], { stdio: 'inherit' });
      if (result.status === 0) {
        console.log(kleur.green(`\n  Committed: ${chosen}\n`));
      }
      break;
    } else if (key === 'e') {
      const edited = await editMessage(messages[0]);
      const result = spawnSync('git', ['commit', '-m', edited], { stdio: 'inherit' });
      if (result.status === 0) {
        console.log(kleur.green(`\n  Committed: ${edited}\n`));
      }
      break;
    } else if (key === 'r') {
      messages = null;
      console.log();
    } else if (key === 'q' || key === '\u0003') {
      console.log(kleur.dim('\n  Aborted.\n'));
      break;
    }
  }
}

await main();
