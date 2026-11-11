import { expect, test } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { providers, getProvider, parseProviders, selectProviders, resolveProviderLogo } from '../src/index'

test('the exported snapshot matches every source provider record', () => {
  const directory = new URL('../providers/', import.meta.url)
  const ids = readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
  expect(providers.map(p => p.id).sort()).toEqual(ids.sort())
  for (const id of ids) {
    const data = JSON.parse(readFileSync(new URL(`${id}/provider.json`, directory), 'utf8'))
    expect(getProvider(id)).toEqual(parseProviders([data])[0])
  }
})

test('allowlists are strict, including empty lists and disabled hosts', () => {
  expect(selectProviders({ ids: [] })).toEqual([])
  expect(() => selectProviders({ ids: ['typo'] })).toThrow('Unknown provider')
  expect(selectProviders({ ids: ['bluesky'] }).map(p => p.id)).toEqual(['bluesky'])
  expect(selectProviders({ ids: ['bluesky'] }, [{ ...getProvider('bluesky')!, enabled: false }])).toEqual([])
  expect(Object.isFrozen(providers[0])).toBe(true)
})

test('unknown invite requirements are distinct from explicitly open signup', () => {
  const snapshot = [
    { ...providers[0]!, id: 'open', requiresInvite: false },
    { ...providers[0]!, id: 'unknown', requiresInvite: undefined },
    { ...providers[0]!, id: 'closed', requiresInvite: true },
  ]
  expect(selectProviders({ invite: 'not-required' }, snapshot).map(p => p.id)).toEqual(['open'])
  expect(selectProviders({ invite: 'unknown' }, snapshot).map(p => p.id)).toEqual(['unknown'])
})

test('rejects unsafe data and equivalent duplicate service endpoints', () => {
  for (const serviceUrl of [
    'http://example.com',
    'javascript:alert(1)',
    'https://user:pass@example.com',
    'https://host.test/#token',
  ]) {
    expect(() => parseProviders([{ ...providers[0], serviceUrl }])).toThrow()
  }
  expect(() =>
    parseProviders([getProvider('bluesky'), { ...getProvider('eurosky'), serviceUrl: 'https://bsky.social/' }]),
  ).toThrow('Duplicate')
  expect(() => parseProviders([{ ...providers[0], logo: '../escape.svg' }])).toThrow()
  expect(() => parseProviders([{ ...providers[0], requiresInvite: 'false' }])).toThrow()
  expect(resolveProviderLogo(getProvider('bluesky')!, 'https://my.app/hosts/bluesky')).toBe(
    'https://my.app/hosts/bluesky/bluesky.svg',
  )
})
