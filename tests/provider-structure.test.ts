import { expect, test } from 'vitest'
import { lstatSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Ajv2020 } from 'ajv/dist/2020.js'
import schema from '../schema.json'

const root = fileURLToPath(new URL('../providers/', import.meta.url))
const entries = readdirSync(root, { withFileTypes: true })
const required = [...new Set([...schema.items.required, 'logo'])]
const validate = new Ajv2020({ allErrors: true }).compile({ ...schema.items, required })

test('the registry contains provider directories', () => {
  expect(entries.length).toBeGreaterThan(0)
  for (const entry of entries) {
    expect(entry.isDirectory(), `providers/${entry.name} must be a provider directory`).toBe(true)
  }
})

test.each(entries.filter(entry => entry.isDirectory()).map(entry => entry.name))(
  '%s has the required provider data and a local logo',
  id => {
    const directory = join(root, id)
    const metadata = join(directory, 'provider.json')
    expect(lstatSync(metadata, { throwIfNoEntry: false })?.isFile(), `${id}/provider.json is required`).toBe(true)

    const data = JSON.parse(readFileSync(metadata, 'utf8'))
    expect(validate(data), `${id}: ${JSON.stringify(validate.errors)}`).toBe(true)
    expect(data.id, 'Provider ID must match the directory name').toBe(id)
    for (const field of required) {
      if (typeof data[field] === 'string') {
        expect(data[field].trim().length, `${id}.${field} must not be blank`).toBeGreaterThan(0)
      }
    }
    expect(new URL(data.serviceUrl).protocol).toBe('https:')
    expect(data.logo).not.toContain('..')
    const logo = lstatSync(join(directory, data.logo), { throwIfNoEntry: false })
    expect(logo?.isFile(), `${id}/${data.logo} must be a regular file`).toBe(true)
    expect(logo?.size ?? 0, `${id}/${data.logo} must not be empty`).toBeGreaterThan(0)
  },
)
