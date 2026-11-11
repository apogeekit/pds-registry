import { expect, test } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import {
  providers,
  getProvider,
  parseProviders,
  selectProviders,
  resolveProviderLogo,
  type PdsProvider,
} from '../src/index'

const fixture: PdsProvider = {
  id: 'example',
  name: 'Example host',
  serviceUrl: 'https://pds.example',
  description: 'A fictional account host for API tests.',
  region: 'Test region',
  enabled: true,
  logo: 'example.svg',
}

test('the exported snapshot matches every source provider record', () => {
  const directory = new URL('../providers/', import.meta.url)
  const ids = readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
  expect(providers.map(p => p.id).sort()).toEqual(ids.sort())
  for (const id of ids) {
    const data = JSON.parse(readFileSync(new URL(`${id}/provider.json`, directory), 'utf8'))
    const provider = getProvider(id)
    expect(provider).toEqual(parseProviders([data])[0])
    expect(Object.isFrozen(provider)).toBe(true)
  }
  expect(getProvider('')).toBeUndefined()
  expect(
    selectProviders()
      .map(p => p.id)
      .sort(),
  ).toEqual(
    providers
      .filter(p => p.enabled)
      .map(p => p.id)
      .sort(),
  )
})

test('allowlists are strict, including empty lists and disabled hosts', () => {
  const directory = [fixture]
  expect(selectProviders({ ids: [] }, directory)).toEqual([])
  expect(() => selectProviders({ ids: ['missing'] }, directory)).toThrow('Unknown provider')
  expect(selectProviders({ ids: [fixture.id] }, directory).map(p => p.id)).toEqual([fixture.id])
  expect(selectProviders({ ids: [fixture.id] }, [{ ...fixture, enabled: false }])).toEqual([])
})

test('unknown invite requirements are distinct from explicitly open signup', () => {
  const snapshot = [
    { ...fixture, id: 'open', requiresInvite: false },
    { ...fixture, id: 'unknown', requiresInvite: undefined },
    { ...fixture, id: 'closed', requiresInvite: true },
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
    expect(() => parseProviders([{ ...fixture, serviceUrl }])).toThrow()
  }
  expect(() => parseProviders([fixture, { ...fixture, id: 'alias', serviceUrl: `${fixture.serviceUrl}/` }])).toThrow(
    'Duplicate',
  )
  expect(() => parseProviders([{ ...fixture, logo: '../escape.svg' }])).toThrow()
  expect(() => parseProviders([{ ...fixture, requiresInvite: 'false' }])).toThrow()
  expect(resolveProviderLogo(fixture, 'https://app.example/assets')).toBe('https://app.example/assets/example.svg')
})
