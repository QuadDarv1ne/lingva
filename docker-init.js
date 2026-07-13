const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const dbDir = path.dirname(process.env.DATABASE_URL?.replace('file:', '') || './db/custom.db')

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

try {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env },
  })
} catch (err) {
  console.error('Failed to initialize database:', err.message)
  process.exit(1)
}

require('./server.js')
