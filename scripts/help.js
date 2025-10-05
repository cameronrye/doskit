#!/usr/bin/env node

/**
 * DosKit - Help Script
 * Displays all available npm scripts with descriptions and nice formatting
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for terminal formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Script descriptions organized by category
const scriptDescriptions = {
  development: {
    title: '🚀 Development',
    scripts: {
      dev: 'Start development server with hot reload and file watching',
      preview: 'Preview production build locally to test before deployment',
    }
  },
  building: {
    title: '🔨 Building',
    scripts: {
      build: 'Compile TypeScript and build optimized production bundle',
    }
  },
  testing: {
    title: '🧪 Testing',
    scripts: {
      test: 'Run all tests once and exit',
      'test:watch': 'Run tests in watch mode (re-runs on file changes)',
      'test:ui': 'Run tests with interactive web UI for debugging',
      'test:coverage': 'Run tests and generate detailed coverage report',
    }
  },
  quality: {
    title: '✨ Code Quality',
    scripts: {
      lint: 'Check code quality and style with ESLint',
    }
  },
  utilities: {
    title: '🛠️  Utilities',
    scripts: {
      'generate-icons': 'Generate app icons in multiple sizes from source',
      help: 'Show this help message with all available commands',
    }
  }
};

/**
 * Format and display the help information
 */
function displayHelp() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                        DosKit Scripts                        ║
║              Available npm run commands                      ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);

  // Calculate the maximum script name length for alignment
  const allScripts = Object.values(scriptDescriptions)
    .flatMap(category => Object.keys(category.scripts));
  const maxScriptLength = Math.max(...allScripts.map(script => script.length));

  // Display each category
  Object.entries(scriptDescriptions).forEach(([_categoryKey, category], index) => {
    // Add spacing between categories (except for the first one)
    if (index > 0) {
      console.log('');
    }

    // Category header
    console.log(`${colors.bright}${colors.yellow}${category.title}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(category.title.length - 2)}${colors.reset}`); // Subtract 2 for emoji

    // Scripts in this category
    Object.entries(category.scripts).forEach(([script, description]) => {
      const padding = ' '.repeat(maxScriptLength - script.length + 2);
      console.log(`  ${colors.bright}${colors.green}${script}${colors.reset}${padding}${colors.dim}${description}${colors.reset}`);
    });
  });

  // Footer with usage examples
  console.log(`
${colors.bright}${colors.blue}Usage Examples:${colors.reset}
  ${colors.cyan}npm run dev${colors.reset}              ${colors.dim}# Start development server${colors.reset}
  ${colors.cyan}npm run build${colors.reset}            ${colors.dim}# Build for production${colors.reset}
  ${colors.cyan}npm run test:watch${colors.reset}       ${colors.dim}# Run tests in watch mode${colors.reset}
  ${colors.cyan}npm run lint${colors.reset}             ${colors.dim}# Check code quality${colors.reset}

${colors.bright}${colors.magenta}Project Info:${colors.reset}
  ${colors.dim}DosKit - A robust, cross-platform foundation for running DOS applications${colors.reset}
  ${colors.dim}Built with React, TypeScript, and js-dos WebAssembly technology${colors.reset}

${colors.bright}${colors.yellow}Need help with a specific command?${colors.reset}
  ${colors.dim}Most commands support --help flag: ${colors.cyan}npm run test -- --help${colors.reset}
`);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
  const packageJsonPath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  console.log(`${colors.bright}${colors.cyan}DosKit v${packageJson.version}${colors.reset}`);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`${colors.bright}Help Script Usage:${colors.reset}
  ${colors.cyan}npm run help${colors.reset}              ${colors.dim}# Show all available scripts${colors.reset}
  ${colors.cyan}npm run help -- --version${colors.reset}  ${colors.dim}# Show project version${colors.reset}
`);
  process.exit(0);
}

// Display the main help
displayHelp();
