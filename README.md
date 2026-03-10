# CommitCraft

AI-powered git commit message generator CLI.

## Quick Start

```bash
npx commitcraft
```

On first run, you'll be guided through a setup wizard to pick your AI provider.

## Providers

| Provider | Model | Requires |
|----------|-------|---------|
| Anthropic | claude-sonnet-4-20250514 | API key |
| OpenAI | gpt-4o | API key |
| Ollama | llama3 (configurable) | Local Ollama |

## Usage

```bash
npx commitcraft           # Generate commit messages for staged files
npx commitcraft --setup   # Re-run setup wizard
npx commitcraft --config  # Show current config
npx commitcraft --help    # Show help
```

## Workflow

1. Stage your changes: `git add <files>`
2. Run `npx commitcraft`
3. Pick a message, edit, or regenerate
4. Done — commit is created automatically

## Publish

```bash
npm login
npm publish --access public
```
