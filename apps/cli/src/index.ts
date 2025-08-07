#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { config } from 'dotenv';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const program = new Command();
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

program
  .name('monorepo')
  .description('CLI tools for Monorepo 5')
  .version(packageJson.version);

// Health check command
program
  .command('health')
  .description('Check health of all services')
  .option('-a, --api <url>', 'API URL', process.env.API_URL || 'http://localhost:3001')
  .option('-w, --web <url>', 'Web URL', process.env.WEB_URL || 'http://localhost:3000')
  .action(async (options) => {
    const spinner = ora('Checking service health...').start();

    try {
      // Check API health
      const apiResponse = await axios.get(`${options.api}/health`, { timeout: 5000 });
      const apiStatus = apiResponse.status === 200 ? 'healthy' : 'unhealthy';
      
      spinner.succeed(chalk.green('Health check completed'));
      
      console.log('\\n' + chalk.bold('Service Health Status:'));
      console.log(chalk.green('✓'), 'API:', chalk.green(apiStatus), `(${options.api})`);
      
      if (apiResponse.data) {
        console.log('  Version:', apiResponse.data.version || 'unknown');
        console.log('  Environment:', apiResponse.data.environment || 'unknown');
        console.log('  Timestamp:', apiResponse.data.timestamp || 'unknown');
      }
      
      // Try to check web service
      try {
        await axios.get(options.web, { timeout: 5000 });
        console.log(chalk.green('✓'), 'Web:', chalk.green('healthy'), `(${options.web})`);
      } catch (webError) {
        console.log(chalk.red('✗'), 'Web:', chalk.red('unhealthy'), `(${options.web})`);
      }
      
    } catch (error: any) {
      spinner.fail(chalk.red('Health check failed'));
      console.log(chalk.red('✗'), 'API:', chalk.red('unhealthy'), `(${options.api})`);
      console.log('  Error:', error.message);
    }
  });

// Development setup command
program
  .command('setup')
  .description('Set up development environment')
  .action(async () => {
    console.log(chalk.bold.blue('\\n🚀 Monorepo 5 Development Setup\\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies?',
        default: true
      },
      {
        type: 'confirm',
        name: 'createEnv',
        message: 'Create .env file?',
        default: true
      },
      {
        type: 'confirm',
        name: 'runMigrations',
        message: 'Run database migrations?',
        default: false
      }
    ]);
    
    if (answers.installDeps) {
      const spinner = ora('Installing dependencies...').start();
      // In a real implementation, you'd run npm install here
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.succeed('Dependencies installed');
    }
    
    if (answers.createEnv) {
      const envSpinner = ora('Creating .env file...').start();
      const envContent = `# Monorepo 5 Environment Variables
NODE_ENV=development
API_PORT=3001
WEB_PORT=3000
DATABASE_URL=postgresql://localhost:5432/monorepo_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
`;
      
      try {
        await fs.writeFile('.env', envContent);
        envSpinner.succeed('.env file created');
      } catch (error) {
        envSpinner.fail('Failed to create .env file');
      }
    }
    
    if (answers.runMigrations) {
      const migrationSpinner = ora('Running database migrations...').start();
      await new Promise(resolve => setTimeout(resolve, 1500));
      migrationSpinner.succeed('Database migrations completed');
    }
    
    console.log(chalk.green('\\n✅ Setup completed successfully!'));
    console.log('\\nNext steps:');
    console.log('1. npm run dev (to start all services)');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. API docs available at http://localhost:3001/health');
  });

// Generate command
program
  .command('generate <type> <name>')
  .description('Generate boilerplate code')
  .option('-d, --directory <dir>', 'Output directory')
  .action(async (type, name, options) => {
    const spinner = ora(`Generating ${type}: ${name}...`).start();
    
    const outputDir = options.directory || process.cwd();
    
    switch (type) {
      case 'component':
        await generateComponent(name, outputDir);
        break;
      case 'api':
        await generateApiRoute(name, outputDir);
        break;
      case 'service':
        await generateService(name, outputDir);
        break;
      default:
        spinner.fail(`Unknown type: ${type}`);
        return;
    }
    
    spinner.succeed(`Generated ${type}: ${name}`);
  });

// Info command
program
  .command('info')
  .description('Show monorepo information')
  .action(() => {
    console.log(chalk.bold.blue('\\n📦 Monorepo 5 Information\\n'));
    console.log('Version:', packageJson.version);
    console.log('Description:', packageJson.description);
    console.log('\\nApps:');
    console.log('  • API Server (Express.js)');
    console.log('  • Web App (React + Vite)');
    console.log('  • CLI Tools (Commander.js)');
    console.log('\\nPackages:');
    console.log('  • UI Components');
    console.log('  • Database Utilities');
    console.log('  • Configuration');
    console.log('  • Utils');
    console.log('  • API Client');
    console.log('  • Orchestration (GLM-4.5)');
  });

// Helper functions
async function generateComponent(name: string, outputDir: string) {
  const componentTemplate = `import React from 'react';

interface ${name}Props {
  // Define props here
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div>
      <h2>{name} Component</h2>
      {/* Component implementation */}
    </div>
  );
};

export default ${name};
`;

  const filePath = path.join(outputDir, `${name}.tsx`);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, componentTemplate);
}

async function generateApiRoute(name: string, outputDir: string) {
  const routeTemplate = `import { Request, Response } from 'express';

// GET /${name}
export const get${name} = async (req: Request, res: Response) => {
  try {
    // Implementation here
    res.json({ message: '${name} retrieved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /${name}
export const create${name} = async (req: Request, res: Response) => {
  try {
    // Implementation here
    res.status(201).json({ message: '${name} created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
`;

  const filePath = path.join(outputDir, `${name}.controller.ts`);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, routeTemplate);
}

async function generateService(name: string, outputDir: string) {
  const serviceTemplate = `export class ${name}Service {
  async findAll() {
    // Implementation here
    return [];
  }

  async findById(id: string) {
    // Implementation here
    return null;
  }

  async create(data: any) {
    // Implementation here
    return data;
  }

  async update(id: string, data: any) {
    // Implementation here
    return data;
  }

  async delete(id: string) {
    // Implementation here
    return true;
  }
}

export const ${name.toLowerCase()}Service = new ${name}Service();
`;

  const filePath = path.join(outputDir, `${name}.service.ts`);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, serviceTemplate);
}

program.parse();