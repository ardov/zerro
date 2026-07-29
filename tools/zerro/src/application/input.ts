import { readFile } from 'node:fs/promises'

import { ToolError } from './output'

export async function readJsonInput(
  path: string | undefined,
  command: string
): Promise<unknown> {
  if (!path)
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      'Command requires --input <path-or->',
      2
    )
  let source: string
  try {
    source = path === '-' ? await readStdin() : await readFile(path, 'utf8')
  } catch {
    throw new ToolError(
      command,
      'none',
      'INPUT_READ_FAILED',
      'Cannot read JSON input',
      2
    )
  }
  try {
    return JSON.parse(source)
  } catch {
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      'Input must be valid JSON',
      2
    )
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}
