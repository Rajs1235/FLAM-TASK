// This file is the heart of the system. It runs as a separate process.
require('dotenv').config(); // Make sure it can read the .env file
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const Job = require('../models/Job.js');
const { connectDB, disconnectDB } = require('../db');

// Flag for graceful shutdown
let isShuttingDown = false;

// --- Graceful Shutdown Handler ---
const gracefulShutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`Worker ${process.pid} shutting down...`);
  await new Promise(r => setTimeout(r, 1000)); 
  await disconnectDB();
  console.log(`Worker ${process.pid} disconnected from DB and exited.`);
  process.exit(0);
};

// Listen for stop signals
process.on('SIGTERM', gracefulShutdown); // From `queuectl worker stop`
process.on('SIGINT', gracefulShutdown);  // From Ctrl+C

// --- Job Execution Logic ---
const executeJob = (job) => {
  return new Promise((resolve, reject) => {
    const child = spawn(job.command, [], { 
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => output += data.toString());
    child.stderr.on('data', (data) => error += data.toString());

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ output, error });
      } else {
        reject({ output, error: error || `Process exited with code ${code}` });
      }
    });

    child.on('error', (err) => {
      reject({ output: '', error: `Execution error: ${err.message}` });
    });
  });
};

// --- Worker's Main Polling Loop ---
const runWorker = async () => {
  await connectDB();
  console.log(`Worker ${process.pid} started. Polling for jobs...`);

  while (!isShuttingDown) {
    let job;
    try {
      job = await Job.findOneAndUpdate(
        {
          state: { $in: ['pending', 'failed'] },
          available_at: { $lte: new Date() }
        },
        {
          $set: { state: 'processing', updatedAt: new Date() },
          $inc: { attempts: 1 }
        },
        { 
          sort: { available_at: 1, createdAt: 1 },
          new: true
        }
      );

    } catch (dbError) {
      console.error(`Worker ${process.pid} DB error: ${dbError.message}. Retrying...`);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    if (!job) {
      if (!isShuttingDown) {
        await new Promise(r => setTimeout(r, 2000));
      }
      continue;
    }

    console.log(`Worker ${process.pid} processing job: ${job.id}`);
    try {
      const { output, error } = await executeJob(job);
      
      await Job.updateOne(
        { _id: job._id },
        { 
          state: 'completed', 
          output: output.trim(),
          error: error.trim()
        }
      );
      console.log(`Worker ${process.pid} COMPLETED job: ${job.id}`);

    } catch (execResult) {
      console.warn(`Worker ${process.pid} FAILED job: ${job.id} (Attempt ${job.attempts})`);

      if (job.attempts >= job.max_retries) {
        await Job.updateOne(
          { _id: job._id },
          { 
            state: 'dead', 
            error: execResult.error.trim(),
            output: execResult.output.trim()
          }
        );
        console.error(`Worker ${process.pid} moved job to DLQ: ${job.id}`);
      } else {
        const delay = (job.base_backoff_seconds ** job.attempts) * 1000;
        const nextAvailableAt = new Date(Date.now() + delay);
        
        await Job.updateOne(
          { _id: job._id },
          { 
            state: 'failed', 
            error: execResult.error.trim(), 
            output: execResult.output.trim(),
            available_at: nextAvailableAt
          }
        );
        console.warn(`Worker ${process.pid} scheduled retry for job ${job.id} in ${delay/1000}s`);
      }
    }
  }
};

runWorker().catch(err => {
  console.error(`Worker ${process.pid} crashed: ${err.message}`, err.stack);
  process.exit(1);
});