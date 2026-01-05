#!/usr/bin/env node

/**
 * CLI wrapper to generated GTM templates
 *
 * Supports:
 *  --merge → genrate a unique file with all events called all_events.md
 *  --out ./output → defines a directory to output the documentation
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.resolve(__dirname, '../generateDocs.js');

const args = process.argv.slice(2);
const subprocess = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });

subprocess.on('exit', (code) => {
  process.exit(code);
});
