/**
 * Display available npm scripts in a formatted help page
 * Cross-platform compatible script for showing all available commands
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse package.json and extract scripts
 */
function getScripts() {
  try {
    const packageJsonPath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.scripts || {};
  } catch (error) {
    console.error(pc.red('❌ Error reading package.json:'), error.message);
    process.exit(1);
  }
}

/**
 * Categorize scripts based on their names and purposes
 */
function categorizeScripts(scripts) {
  const categories = {
    development: [],
    build: [],
    testing: [],
    linting: [],
    utilities: [],
    other: []
  };

  for (const [name, command] of Object.entries(scripts)) {
    if (name === 'dev' || name.includes('serve') || name.includes('start')) {
      categories.development.push({ name, command });
    } else if (name.includes('build') || name.includes('compile')) {
      categories.build.push({ name, command });
    } else if (name.includes('test') || name.includes('coverage')) {
      categories.testing.push({ name, command });
    } else if (name.includes('lint') || name.includes('format')) {
      categories.linting.push({ name, command });
    } else if (name.includes('create') || name.includes('generate') || name.includes('preview')) {
      categories.utilities.push({ name, command });
    } else {
      categories.other.push({ name, command });
    }
  }

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([_, scripts]) => scripts.length > 0)
  );
}

/**
 * Get a friendly description for each category
 */
function getCategoryDescription(category) {
  const descriptions = {
    development: 'Development & Server',
    build: 'Build & Compilation',
    testing: 'Testing & Coverage',
    linting: 'Code Quality & Linting',
    utilities: 'Utilities & Tools',
    other: 'Other Commands'
  };
  return descriptions[category] || category;
}

/**
 * Get the terminal width for proper formatting
 */
function getTerminalWidth() {
  return process.stdout.columns || 80;
}

/**
 * Format a script entry with proper alignment
 */
function formatScriptEntry(name, command, maxNameLength) {
  const terminalWidth = getTerminalWidth();
  const padding = ' '.repeat(maxNameLength - name.length + 2);
  const scriptName = pc.cyan(pc.bold(name));
  const arrow = pc.dim('→');
  
  // Calculate available space for command
  const prefixLength = maxNameLength + 5; // name + padding + arrow
  const availableWidth = terminalWidth - prefixLength - 4;
  
  // Truncate command if too long
  let displayCommand = command;
  if (command.length > availableWidth && availableWidth > 20) {
    displayCommand = command.substring(0, availableWidth - 3) + '...';
  }
  
  return `  ${scriptName}${padding}${arrow} ${pc.dim(displayCommand)}`;
}

/**
 * Display the help page
 */
function displayHelp() {
  const scripts = getScripts();
  const categorized = categorizeScripts(scripts);
  
  // Header
  console.log('\n' + pc.bold(pc.blue('═'.repeat(getTerminalWidth()))));
  console.log(pc.bold(pc.blue('  📦 Available NPM Scripts')));
  console.log(pc.bold(pc.blue('═'.repeat(getTerminalWidth()))) + '\n');
  
  // Find the longest script name for alignment
  const allScripts = Object.values(categorized).flat();
  const maxNameLength = Math.max(...allScripts.map(s => s.name.length));
  
  // Display each category
  for (const [category, scriptList] of Object.entries(categorized)) {
    const categoryTitle = getCategoryDescription(category);
    console.log(pc.bold(pc.green(`▸ ${categoryTitle}`)));
    console.log(pc.dim('─'.repeat(getTerminalWidth())));
    
    scriptList.forEach(({ name, command }) => {
      console.log(formatScriptEntry(name, command, maxNameLength));
    });
    
    console.log(''); // Empty line between categories
  }
  
  // Footer with usage instructions
  console.log(pc.bold(pc.blue('─'.repeat(getTerminalWidth()))));
  console.log(pc.bold('  Usage:'));
  console.log(`  ${pc.yellow('npm run')} ${pc.cyan('<script-name>')}`);
  console.log(`  ${pc.dim('Example:')} ${pc.yellow('npm run')} ${pc.cyan('dev')}\n`);
  
  // Additional help
  console.log(pc.dim('  💡 Tip: Run this help anytime with:'), pc.yellow('npm run help'));
  console.log(pc.bold(pc.blue('═'.repeat(getTerminalWidth()))) + '\n');
}

// Run the help display
displayHelp();

