import fs from 'node:fs';
import path from 'node:path';
import { AgentClient } from '@21st-sdk/node';
import './load-env';

interface CliOptions {
  agent: string;
  prompt?: string;
  promptFile?: string;
  outputFile?: string;
  contextFiles: string[];
  name?: string;
  maxTurns?: number;
  maxBudgetUsd?: number;
}

interface MessageMetadata {
  sessionId?: string;
  totalCostUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  resultSubtype?: string;
  finalTextId?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    agent: process.env.NEXT_PUBLIC_21ST_AGENT_SLUG?.trim() || 'my-agent',
    contextFiles: [],
    maxTurns: 12,
    maxBudgetUsd: 1,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--agent' && next) {
      options.agent = next;
      index += 1;
      continue;
    }

    if (current === '--prompt' && next) {
      options.prompt = next;
      index += 1;
      continue;
    }

    if (current === '--prompt-file' && next) {
      options.promptFile = next;
      index += 1;
      continue;
    }

    if (current === '--output-file' && next) {
      options.outputFile = next;
      index += 1;
      continue;
    }

    if (current === '--context-file' && next) {
      options.contextFiles.push(next);
      index += 1;
      continue;
    }

    if (current === '--name' && next) {
      options.name = next;
      index += 1;
      continue;
    }

    if (current === '--max-turns' && next) {
      options.maxTurns = Number(next);
      index += 1;
      continue;
    }

    if (current === '--max-budget' && next) {
      options.maxBudgetUsd = Number(next);
      index += 1;
    }
  }

  return options;
}

function resolvePrompt(options: CliOptions) {
  const contextBlocks = options.contextFiles.map((filePath) => {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const extension = path.extname(absolutePath).replace(/^\./, '') || 'txt';
    const content = fs.readFileSync(absolutePath, 'utf8');

    return `\n\n## File Context: \`${filePath}\`\n\n\`\`\`${extension}\n${content}\n\`\`\``;
  });

  if (options.prompt?.trim()) {
    return {
      source: 'inline',
      text: `${options.prompt.trim()}${contextBlocks.join('')}`,
    };
  }

  if (options.promptFile) {
    const absolutePath = path.resolve(process.cwd(), options.promptFile);
    const text = fs.readFileSync(absolutePath, 'utf8').trim();

    if (!text) {
      throw new Error(`Prompt file is empty: ${absolutePath}`);
    }

    return {
      source: absolutePath,
      text: `${text}${contextBlocks.join('')}`,
    };
  }

  throw new Error('Provide --prompt or --prompt-file.');
}

function formatMarkdown(params: {
  agent: string;
  promptSource: string;
  promptText: string;
  responseText: string;
  metadata?: MessageMetadata;
  startedAt: string;
  finishedAt: string;
}) {
  const { agent, promptSource, promptText, responseText, metadata, startedAt, finishedAt } = params;
  const metadataLines = [
    `- Agent: \`${agent}\``,
    `- Prompt source: \`${promptSource}\``,
    `- Started: \`${startedAt}\``,
    `- Finished: \`${finishedAt}\``,
  ];

  if (metadata?.sessionId) metadataLines.push(`- Session ID: \`${metadata.sessionId}\``);
  if (typeof metadata?.totalCostUsd === 'number') metadataLines.push(`- Total cost USD: \`${metadata.totalCostUsd.toFixed(6)}\``);
  if (typeof metadata?.inputTokens === 'number') metadataLines.push(`- Input tokens: \`${metadata.inputTokens}\``);
  if (typeof metadata?.outputTokens === 'number') metadataLines.push(`- Output tokens: \`${metadata.outputTokens}\``);
  if (typeof metadata?.totalTokens === 'number') metadataLines.push(`- Total tokens: \`${metadata.totalTokens}\``);
  if (typeof metadata?.durationMs === 'number') metadataLines.push(`- Duration ms: \`${metadata.durationMs}\``);
  if (metadata?.resultSubtype) metadataLines.push(`- Result: \`${metadata.resultSubtype}\``);

  return [
    '# 21st Live Response',
    '',
    '## Metadata',
    ...metadataLines,
    '',
    '## Prompt',
    '',
    promptText,
    '',
    '## Response',
    '',
    responseText || '_No text response received._',
    '',
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const apiKey = process.env.API_KEY_21ST?.trim();

  if (!apiKey) {
    throw new Error('API_KEY_21ST is missing in the environment.');
  }

  const prompt = resolvePrompt(options);
  const client = new AgentClient({ apiKey });
  const startedAt = new Date().toISOString();

  const run = await client.threads.run({
    agent: options.agent,
    name: options.name ?? 'frontend-improvement',
    messages: [
      {
        role: 'user',
        parts: [{ type: 'text', text: prompt.text }],
      },
    ],
    options: {
      maxTurns: options.maxTurns,
      maxBudgetUsd: options.maxBudgetUsd,
    },
  });

  const reader = run.response.body?.getReader();
  if (!reader) {
    throw new Error('21st returned no readable stream.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let responseText = '';
  let metadata: MessageMetadata | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (buffer.includes('\n\n')) {
      const boundary = buffer.indexOf('\n\n');
      const rawEvent = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (!rawEvent) {
        continue;
      }

      const dataLines = rawEvent
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim());

      if (dataLines.length === 0) {
        continue;
      }

      const payload = dataLines.join('\n');
      if (payload === '[DONE]') {
        continue;
      }

      const event = JSON.parse(payload) as {
        type?: string;
        delta?: string;
        messageMetadata?: MessageMetadata;
      };

      if (event.type === 'text-delta' && event.delta) {
        responseText += event.delta;
      } else if (event.type === 'message-metadata') {
        metadata = event.messageMetadata;
      }
    }
  }

  const output = formatMarkdown({
    agent: options.agent,
    promptSource: prompt.source,
    promptText: prompt.text,
    responseText: responseText.trim(),
    metadata,
    startedAt,
    finishedAt: new Date().toISOString(),
  });

  if (options.outputFile) {
    const outputPath = path.resolve(process.cwd(), options.outputFile);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output, 'utf8');
    process.stdout.write(`Saved 21st response to ${outputPath}\n`);
  } else {
    process.stdout.write(`${output}\n`);
  }

  if (typeof metadata?.totalCostUsd === 'number') {
    process.stdout.write(`21st usage recorded: $${metadata.totalCostUsd.toFixed(6)}\n`);
  }
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
