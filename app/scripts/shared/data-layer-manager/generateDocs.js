#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'process';

/**
 * Parse fields from a event to a markdown format
 */
function parseFields(obj, depth = 0) {
  const indent = '  '.repeat(depth);
  let markDown = '';

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      if ('type' in value || 'required' in value) {
        markDown += `${indent}- **${key}** ${value?.default || ''} (${value.type || 'any'}) ${
          value.required ? '✅ required' : ''
        }\n`;
      } else {
        markDown += `${indent}- **${key}**:\n`;
        markDown += parseFields(value, depth + 1);
      }
    } else if (Array.isArray(value)) {
      markDown += `${indent}- **${key}** (array):\n`;
      if (value.length > 0) {
        markDown += parseFields(value[0], depth + 1);
      }
    } else {
      markDown += `${indent}- **${key}**: ${value || ''} (${typeof value})\n`;
    }
  }

  return markDown;
}

/**
 * Validae if all required fields has the expected structure
 */
function validateRequiredFields(template) {
  const missingFields = [];

  const checkFields = (fields, structure, prefix = '') => {
    for (const [key, value] of Object.entries(fields)) {
      const pathName = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && !Array.isArray(value)) {
        if (value.required && structure?.[key] === undefined) {
          missingFields.push(pathName);
        }
        if (!('type' in value)) {
          checkFields(value, structure?.[key], pathName);
        }
      } else if (Array.isArray(value)) {
        if (Array.isArray(structure?.[key]) && value.length > 0 && structure[key].length > 0) {
          checkFields(value[0], structure[key][0], pathName + '[0]');
        }
      }
    }
  };

  for (const [eventName, eventData] of Object.entries(template)) {
    const { docs, ...fields } = eventData;
    if (docs?.structureExpected) {
      checkFields(fields, docs.structureExpected, eventName);
    }
  }

  return missingFields;
}

/**
 * Generate a documentation in the markdown format from a specific template
 */
function generateMarkdown(template, fileName) {
  let output = `# 📘 Documentation — ${fileName}\n\n`;
  let summary = '## 📜 Sumário\n\n';

  for (const [eventName] of Object.entries(template)) {
    summary += `- [${eventName}](#${eventName.toLowerCase().replace(/_/g, '-')})\n`;
  }

  output += summary;

  for (const [eventName, eventData] of Object.entries(template)) {
    const { docs, ...eventFields } = eventData;

    output += `## ${eventName}\n\n`;

    if (docs?.description) {
      output += `${docs.description}\n\n`;
    }

    output += `**Template file:** \`${fileName}\`\n\n`;

    output += `### ⚙️ Detailed Structure\n\n`;
    output += parseFields(eventFields);
    output += '\n';

    if (docs?.structureExpected) {
      output += `### 🧩 Expected Payload\n\n`;
      output += '```json\n';
      output += JSON.stringify(docs.structureExpected, null, 2);
      output += '\n```\n\n';
    }
  }

  return `${output}`;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`❌ Wrong use.

Example:
  node src/generateDocs.js ./templates --out ./docs
  node src/generateDocs.js ./templates --merge --out ./docs
`);
    process.exit(1);
  }

  const templatesDirectory = args[0];
  const merge = args.includes('--merge');
  const outIndex = args.indexOf('--out');
  const outputDirectory = outIndex !== -1 ? args[outIndex + 1] : './docs';

  if (!fs.existsSync(templatesDirectory)) {
    console.error(`❌ Folder "${templatesDirectory}" not found.`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  const files = fs.readdirSync(templatesDirectory).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.warn('⚠️ No JSON FILE found.');
    process.exit(0);
  }

  let mergedTitle = `# 📘 Full Documentation — All Events\n\n`;
  let mergedOutput = '';
  let mergedSummary = '## 📜 Summary\n\n';

  for (const file of files) {
    const filePath = path.join(templatesDirectory, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    const missingFields = validateRequiredFields(json);
    if (missingFields.length > 0) {
      console.warn(`⚠️ Required fields are missing in ${file}:`);
      missingFields.forEach((m) => console.warn(`   - ${m}`));
    }

    const markdown = generateMarkdown(json, file);

    if (merge) {
      mergedOutput += `\n---\n\n${markdown}`;
      mergedSummary += markdown.match(/- \[.*\]\(#[^)]+\)/g)?.join('\n') + '\n';
    } else {
      const outputFile = path.join(outputDirectory, file.replace('.json', '.md'));
      fs.writeFileSync(outputFile, markdown);
      console.log(`✅ Documentation generated: ${outputFile}`);
    }
  }

  if (merge) {
    const outputFile = path.join(outputDirectory, 'all_events.md');
    const completeFile = `${mergedTitle}\n\n${mergedSummary}\n\n${mergedOutput}`;
    fs.writeFileSync(outputFile, completeFile);
    console.log(`✅ Full documentation generated in: ${outputFile}`);
  }
}

main();
