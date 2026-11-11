import { mkdirSync, readFileSync, readdirSync, rmSync, lstatSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Ajv2020 } from 'ajv/dist/2020.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const schema = JSON.parse(readFileSync(join(root, 'schema.json'), 'utf8'))
const ajv = new Ajv2020()
const validate = ajv.compile(schema)

export function buildDirectory(sourceRoot, outputFile) {
  const directories = readdirSync(sourceRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
  const providers = directories.map(directory => {
    const provider = JSON.parse(readFileSync(join(sourceRoot, directory.name, 'provider.json'), 'utf8'))
    if (provider.id !== directory.name) throw new Error(`Provider ID must match its directory: ${directory.name}`)
    return provider
  })
  if (!validate(providers)) throw new Error(`Invalid provider data: ${ajv.errorsText(validate.errors)}`)

  const services = new Set()
  for (const provider of providers) {
    const service = new URL(provider.serviceUrl).href.replace(/\/$/, '')
    if (services.has(service)) throw new Error(`Duplicate service URL: ${provider.id}`)
    services.add(service)
    if (!provider.logo || provider.logo.includes('..')) throw new Error(`Invalid logo filename: ${provider.id}`)
    const logo = join(sourceRoot, provider.id, provider.logo)
    if (!lstatSync(logo, { throwIfNoEntry: false })?.isFile()) throw new Error(`Missing logo: ${provider.id}`)
  }

  mkdirSync(dirname(outputFile), { recursive: true })
  writeFileSync(outputFile, `${JSON.stringify(providers, null, 2)}\n`)
  return providers
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  rmSync(join(root, 'dist'), { recursive: true, force: true })
  buildDirectory(join(root, 'providers'), join(root, 'dist/providers.json'))
}
