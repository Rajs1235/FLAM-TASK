const { fork } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

// --- This is the most important fix ---
// We are now requiring your exact filenames
const Job = require('../models/Job.js');
const Config = require('../models/Configdata.model.js');
const { connectDB, disconnectDB } = require('../db/index.js'); 
const PID_FILE = path.join(__dirname, '..', '.pids');

const getConfig = async () => {
  const defaults = {
    default_max_retries: 3,
    default_base_backoff: 2
  };
  
  try {
    const configs = await Config.find({});
    configs.forEach(c => {
      defaults[c.key] = parseInt(c.value, 10) || c.value;
    });
  } catch (err) {
    console.warn(chalk.yellow('Could not load config from DB, using defaults.'));
  }
  return defaults;
};

// --- Command Implementations ---

exports.enqueue = async (jsonString) => {
  try {
    await connectDB();
    const jobData = JSON.parse(jsonString);
    if (!jobData.id || !jobData.command) {
      throw new Error('\'id\' and \'command\' are required fields in the JSON string.');
    }
    
    const config = await getConfig();

    const job = new Job({
      id: jobData.id,
      command: jobData.command,
      max_retries: jobData.max_retries || config.default_max_retries,
      base_backoff_seconds: jobData.base_backoff_seconds || config.default_base_backoff,
      state: jobData.state || 'pending',
      available_at: jobData.run_at ? new Date(jobData.run_at) : new Date()
    });

    await job.save();
    console.log(chalk.green(`Job enqueued: ${job.id}`));

  } catch (err) {
    if (err.code === 11000) {
      console.error(chalk.red(`Error: A job with ID '${err.keyValue.id}' already exists.`));
    } else {
      console.error(chalk.red(`Error enqueuing job: ${err.message}`));
    }
  } finally {
    await disconnectDB();
  }
};

exports.startWorkers = async (options) => {
  const count = parseInt(options.count, 10) || 1;
  const pids = await fs.readJson(PID_FILE).catch(() => ({ workers: [] }));
  
  console.log(chalk.blue(`Starting ${count} worker(s)...`));

  for (let i = 0; i < count; i++) {
    const workerScriptPath = path.join(__dirname, '../lib/worker.js');
    const workerProcess = fork(
      workerScriptPath, [], { detached: true, stdio: 'ignore' }
    );
    workerProcess.unref(); 
    pids.workers.push(workerProcess.pid);
    console.log(chalk.green(`Started worker with PID: ${workerProcess.pid}`));
  }
  
  await fs.writeJson(PID_FILE, pids, { spaces: 2 });
  console.log(chalk.green('All workers started. They will run in the background.'));
};

exports.stopWorkers = async () => {
  const pids = await fs.readJson(PID_FILE).catch(() => ({ workers: [] }));
  if (pids.workers.length === 0) {
    console.log(chalk.yellow('No active workers found in PID file.'));
    return;
  }
  
  console.log(chalk.blue(`Sending graceful stop signal (SIGTERM) to ${pids.workers.length} worker(s)...`));
  
  for (const pid of pids.workers) {
    try {
      process.kill(pid, 'SIGTERM');
      console.log(chalk.green(`Sent SIGTERM to worker: ${pid}`));
    } catch (err) {
      console.warn(chalk.yellow(`Failed to stop worker ${pid} (may already be stopped): ${err.message}`));
    }
  }
  
  await fs.writeJson(PID_FILE, { workers: [] });
  console.log(chalk.green('All workers signaled. Cleared PID file.'));
};

exports.showStatus = async () => {
  try {
    await connectDB();
    
    const stats = await Job.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const pids = await fs.readJson(PID_FILE).catch(() => ({ workers: [] }));
    
    console.log(chalk.bold.cyan('--- Job Queue Status ---'));
    if (stats.length === 0) {
      console.log('No jobs in queue.');
    } else {
      stats.forEach(s => {
        console.log(`${chalk.green(s._id.padEnd(12))}: ${s.count}`);
      });
    }
    
    console.log(chalk.bold.cyan('\n--- Active Workers ---'));
    console.log(`${chalk.green('Count'.padEnd(12))}: ${pids.workers.length}`);
    if (pids.workers.length > 0) {
        console.log(chalk.dim(`PIDs: ${pids.workers.join(', ')}`));
    }

  } catch (err) {
    console.error(chalk.red(`Error fetching status: ${err.message}`));
  } finally {
    await disconnectDB();
  }
};

exports.listJobs = async (options) => {
  try {
    await connectDB();
    const state = options.state || 'pending';
    
    const jobs = await Job.find({ state })
      .limit(20)
      .sort('-createdAt');
    
    if (jobs.length === 0) {
      console.log(chalk.yellow(`No jobs found with state: ${state}`));
    } else {
      console.log(chalk.bold.cyan(`--- Jobs [${state}] (max 20) ---`));
      console.log(chalk.dim('ID'.padEnd(20) + 'Command'.padEnd(30) + 'Attempts'));
      console.log(chalk.dim('-'.repeat(60)));
      
      jobs.forEach(j => {
        const commandShort = j.command.length > 28 ? j.command.substring(0, 25) + '...' : j.command;
        console.log(`${chalk.green(j.id.padEnd(20))}${commandShort.padEnd(30)}${j.attempts}`);
      });
    }
  } catch (err) {
    console.error(chalk.red(`Error listing jobs: ${err.message}`));
  } finally {
    await disconnectDB();
  }
};

exports.listDLQ = async () => {
  await exports.listJobs({ state: 'dead' });
};

exports.retryDLQJob = async (jobId) => {
  try {
    await connectDB();
    
    const result = await Job.findOneAndUpdate(
      { id: jobId, state: 'dead' },
      {
        $set: {
          state: 'pending',
          available_at: new Date(),
          error: '',
          attempts: 0
        }
      }
    );
    
    if (result) {
      console.log(chalk.green(`Job ${jobId} successfully re-queued from DLQ.`));
    } else {
      console.error(chalk.red(`Job ${jobId} not found in DLQ (state: 'dead').`));
    }
  } catch (err) {
    console.error(chalk.red(`Error retrying job: ${err.message}`));
  } finally {
    await disconnectDB();
  }
};

exports.setConfig = async (key, value) => {
  try {
    await connectDB();
    await Config.updateOne(
      { key },
      { $set: { value } },
      { upsert: true }
    );
    console.log(chalk.green(`Config set: ${key} = ${value}`));
  } catch (err) {
    console.error(chalk.red(`Error setting config: ${err.message}`));
  } finally {
    await disconnectDB();
  }
};
