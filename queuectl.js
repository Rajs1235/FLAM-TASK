#!/usr/bin/env node
require('dotenv').config(); // <-- This loads your .env file
const { Command } = require('commander');
const commands = require('./controllers/commandController.js'); // <-- Fixed
const chalk = require('chalk');
const program = new Command();

program
  .name('queuectl')
  .description('A CLI for managing a background job queue');

program
  .command('enqueue <jsonString>')
  .description('Add a new job to the queue. e.g., \'{"id":"job1","command":"sleep 2"}\'')
  .action(commands.enqueue);

const worker = program.command('worker')
  .description('Manage worker processes');

worker
  .command('start')
  .description('Start one or more workers in the background')
  .option('-c, --count <number>', 'Number of workers to start', 1)
  .action(commands.startWorkers);

worker
  .command('stop')
  .description('Stop all running workers gracefully')
  .action(commands.stopWorkers);

program
  .command('status')
  .description('Show summary of all job states & active workers')
  .action(commands.showStatus); // <-- We put the real command back

program
  .command('list')
  .description('List jobs by state')
  .option('-s, --state <state>', 'Filter by state (default: pending)', 'pending')
  .action(commands.listJobs);

const dlq = program.command('dlq')
  .description('Manage the Dead Letter Queue');

dlq
  .command('list')
  .description('View all jobs in the DLQ (state: dead)')
  .action(commands.listDLQ);

dlq
  .command('retry <jobId>')
  .description('Retry a specific job from the DLQ')
  .action(commands.retryDLQJob);

const config = program.command('config')
  .description('Manage configuration');

config
  .command('set <key> <value>')
  .description('Set a configuration value (e.g., default_max_retries 3)')
  .action(commands.setConfig);

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\n'), program.args.join(' '));
  program.help();
  process.exit(1);
});

// Gracefully handle no command
if (process.argv.length < 3) {
  program.help();
} else {
  program.parse(process.argv);
}