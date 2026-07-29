// @vitest-environment node

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { parseZmToken, withLocalZmToken } from './dotenv'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('local tool token loading', () => {
  it('parses only ZM_TOKEN without evaluating dotenv content', () => {
    expect(parseZmToken('OTHER=value\nexport ZM_TOKEN="quoted-token"\n')).toBe(
      'quoted-token'
    )
    expect(parseZmToken('TOKEN=ignored\n')).toBeUndefined()
  })

  it('uses .env.local only when ZM_TOKEN is absent', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-dotenv-'))
    directories.push(directory)
    await writeFile(join(directory, '.env.local'), 'ZM_TOKEN=file-token\n')

    await expect(withLocalZmToken({}, directory)).resolves.toMatchObject({
      ZM_TOKEN: 'file-token',
    })
    await expect(
      withLocalZmToken({ ZM_TOKEN: 'explicit-token' }, directory)
    ).resolves.toEqual({ ZM_TOKEN: 'explicit-token' })
  })

  it('leaves the environment untouched when the local file is absent', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-dotenv-'))
    directories.push(directory)
    const env = { PATH: '/bin' }
    await expect(withLocalZmToken(env, directory)).resolves.toBe(env)
  })
})
