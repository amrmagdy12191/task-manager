import { copyFile, mkdir } from 'node:fs/promises'

export default async function setup() {
  await mkdir('.cache', { recursive: true })
  await copyFile('data/demo-data.json', '.cache/e2e-demo.json')
}
