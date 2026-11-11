import { afterEach, beforeEach, expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDirectory } from '../scripts/build-directory.mjs'

let root
let source
let output
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pds-directory-'))
  source = join(root, 'providers')
  output = join(root, 'dist/providers.json')
  mkdirSync(source)
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

function addProvider(id, overrides = {}) {
  const directory = join(source, id)
  mkdirSync(directory)
  const provider = {
    id,
    name: id,
    serviceUrl: `https://${id}.example`,
    description: 'A test account host.',
    region: 'Canada',
    enabled: true,
    logo: `${id}.svg`,
    ...overrides,
  }
  writeFileSync(join(directory, 'provider.json'), JSON.stringify(provider))
  writeFileSync(join(directory, `${id}.svg`), '<svg xmlns="http://www.w3.org/2000/svg"/>')
}

test('new provider directories are discovered and removed providers leave the exported JSON', () => {
  addProvider('zeta')
  expect(buildDirectory(source, output).map(p => p.id)).toEqual(['zeta'])
  addProvider('alpha')
  expect(buildDirectory(source, output).map(p => p.id)).toEqual(['alpha', 'zeta'])
  expect(JSON.parse(readFileSync(output, 'utf8')).map(p => p.id)).toEqual(['alpha', 'zeta'])
  rmSync(join(source, 'alpha'), { recursive: true })
  expect(buildDirectory(source, output).map(p => p.id)).toEqual(['zeta'])
})

test('provider IDs must match their directory', () => {
  addProvider('alpha', { id: 'another-host' })
  expect(() => buildDirectory(source, output)).toThrow('Provider ID must match its directory')
})

test('provider files must conform to the shared schema', () => {
  addProvider('alpha', { enabled: 'true' })
  expect(() => buildDirectory(source, output)).toThrow('Invalid provider data')
})

test.each(['id', 'name', 'serviceUrl', 'description', 'region', 'enabled', 'logo'])(
  'a provider cannot omit its required %s field',
  field => {
    addProvider('alpha', { [field]: undefined })
    expect(() => buildDirectory(source, output)).toThrow()
  },
)

test('every provider directory must include provider.json', () => {
  addProvider('alpha')
  rmSync(join(source, 'alpha/provider.json'))
  expect(() => buildDirectory(source, output)).toThrow(/provider\.json/)
})

test('logos cannot escape their provider directory', () => {
  addProvider('alpha', { logo: '../alpha.svg' })
  writeFileSync(join(source, 'alpha.svg'), '<svg/>')
  expect(() => buildDirectory(source, output)).toThrow('Invalid provider data')
})

test('each provider must include its referenced logo', () => {
  addProvider('alpha')
  rmSync(join(source, 'alpha/alpha.svg'))
  expect(() => buildDirectory(source, output)).toThrow('Missing logo')
})

test('equivalent service URLs cannot be registered twice', () => {
  addProvider('alpha')
  addProvider('beta', { serviceUrl: 'https://alpha.example/' })
  expect(() => buildDirectory(source, output)).toThrow('Duplicate service URL')
})
