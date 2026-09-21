#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('node:child_process')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')
const checkOnly = process.argv.includes('--check-only')

function run(command) {
  return execSync(command, {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim()
}

try {
  const status = run('git status --short')
  if (!status) {
    console.log('No changes to commit.')
    process.exit(0)
  }

  if (checkOnly) {
    console.log('Changes detected; commit is needed.')
    process.exit(0)
  }

  run('git add .')

  const branch = run('git branch --show-current').trim() || 'main'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const message = `chore: auto-commit ${timestamp}`

  try {
    run(`git commit -m "${message}"`)
    console.log(`Committed on ${branch}: ${message}`)
  } catch (error) {
    const output = String(error.stdout || error.stderr || '')
    if (output.includes('nothing to commit')) {
      console.log('No content changes to commit.')
      process.exit(0)
    }
    throw error
  }

  try {
    run('git push')
    console.log('Push successful.')
  } catch (error) {
    console.error('Push failed. Check git remote/authentication.')
    console.error(String(error.stdout || error.stderr || ''))
    process.exit(1)
  }
} catch (error) {
  const output = String(error.stdout || error.stderr || error)
  console.error(output || 'Unexpected error during auto-commit.')
  process.exit(1)
}
