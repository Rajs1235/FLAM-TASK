# QUEUECTL (Node.js Version)
# Overview
queuectl is a comprehensive, CLI-based background job queue system designed to manage a distributed task pipeline. The system is built with a powerful Node.js backend and MongoDB for persistent storage.

It's a minimal, production-grade system that supports enqueuing jobs, running multiple concurrent worker processes, handling automatic retries with exponential backoff, and maintaining a Dead Letter Queue (DLQ) for permanently failed jobs.

# Features
⚙️ System Features
Persistent Job Storage: All job states and metadata are stored in MongoDB, ensuring data survives restarts.

Concurrent Workers: Run multiple, parallel worker processes using child_process.fork to process jobs at scale.

Atomic Job Locking: Prevents race conditions and duplicate job execution. Workers use atomic findOneAndUpdate operations to "lock" a job before processing.

Exponential Backoff: Failed jobs are automatically retried. The delay between retries increases exponentially (delay = base ^ attempts) to avoid overwhelming failing services.

Dead Letter Queue (DLQ): After exhausting all max_retries, jobs are moved to a dead state (the DLQ) for manual review.

Graceful Shutdown: Workers listen for SIGTERM signals (from worker stop) to finish their current job before exiting, preventing data corruption.

# 💻 CLI Commands
enqueue: Add a new job to the queue with a specific command.

worker start: Start one or more background worker processes.

worker stop: Send a graceful shutdown signal to all running workers.

status: Get a high-level summary of all job states and the number of active workers.

list: List jobs by their state (e.g., pending, completed, dead).

dlq list: A shortcut to view all jobs in the Dead Letter Queue.

dlq retry: Manually re-queue a specific job from the DLQ.

config set: Set global configurations, like default_max_retries.

# Technology Stack & Architecture
The application is architected with a modern Node.js backend designed for a CLI environment.

# Backend (CLI & Workers):

The core application is built with Node.js.

commander is used to build the user-friendly, Git-like CLI interface (queuectl.js).

child_process.fork is used to spawn worker processes in the background.

fs-extra is used to manage a .pids file, allowing the stop command to know which processes to signal.

The CLI logic is organized into controllers/commandController.js for clear separation of concerns.

# Database:

MongoDB serves as the persistent, central datastore for all jobs.

Mongoose is used as the Object Data Modeler (ODM) to define schemas (Job.js, Config.js) and interact with the database.

# Core Architecture:

queuectl.js: The main CLI entry point. It parses commands and routes them to the controller.

controllers/: Contains all the business logic for each CLI command. It's responsible for interacting with the database and managing worker processes.

db/index.js: Manages the database connection pool.

models/: Defines the Mongoose schemas for Job and Config.

lib/worker.js: A standalone script that runs as a separate, background process. It polls MongoDB for work, executes jobs atomically using child_process.spawn, and handles the complete retry/backoff/DLQ logic.

# Robustness & Design
The application is built with a strong emphasis on robustness and correctness.

# Concurrency Control:

The primary challenge in a job queue is preventing two workers from grabbing the same job. This is solved by using a single, atomic findOneAndUpdate operation. This query finds a due job and simultaneously updates its state to processing, making it invisible to other workers in a single, un-interruptible database operation.

# Process Management:

Workers are launched as detached background processes. Their Process IDs (PIDs) are stored in a .pids file.

The worker stop command reads this file and sends a SIGTERM signal to each PID, allowing for a graceful shutdown. This is a simple file-based solution suitable for a single-machine deployment.

# Secure Credentials Management:

All sensitive credentials (like the MONGO_URI) are managed via environment variables and loaded securely using the dotenv package. They are never hard-coded.

Screenshots
node queuectl.js status (Empty Queue) !(path/to/status-empty.png)

node queuectl.js worker start !(path/to/worker-start.png)

node queuectl.js enqueue !(path/to/enqueue.png)

node queuectl.js list --state completed !(path/to/list-completed.png)

node queuectl.js dlq list (Showing a failed job) !(path/to/dlq-list.png)

node queuectl.js worker stop !(path/to/worker-stop.png)

# Local Installation & Setup
Prerequisites
Node.js: v16 or later

MongoDB: A running MongoDB instance. This can be local (mongodb://127.0.0.1:27017) or a free MongoDB Atlas cluster.

Local Setup
Clone the Repository Open your terminal and clone the project repository:

Bash

git clone https://github.com/Rajs1235/FLAM-TASK.git
cd FLAM-TASK
Install Dependencies

Bash

npm install
Configure Environment Variables

Create a new file in the root directory named .env.

Add your MongoDB connection string to this file.

# Code snippet

# In .env
MONGO_URI="mongodb+srv://<user>:<password>@your-cluster.mongodb.net/queuectl"
Important: If using MongoDB Atlas, make sure you have whitelisted your IP address in the "Network Access" tab of your cluster.

Run the Application All commands are run from the terminal using node queuectl.js <command>. This is the most reliable way to run the tool and avoids system-specific npm link issues.

Bash

# Check if the connection is working
node queuectl.js status
🧪 Testing Flow
You can manually test the entire job lifecycle.

Check Status (should be empty):

Bash

node queuectl.js status
Start a Worker:

Bash

node queuectl.js worker start --count 1
Enqueue a Successful Job (Windows cmd.exe syntax):

Bash

node queuectl.js enqueue "{\"id\":\"job-ok\",\"command\":\"echo This will succeed\"}"
Enqueue a Failing Job:

Bash

node queuectl.js enqueue "{\"id\":\"job-fail\",\"command\":\"exit 1\"}"
Wait 20-30 seconds for the worker to process both jobs (including all retries for the failing one).

Verify Success:

Bash

node queuectl.js list --state completed
(Should show job-ok)

Verify Failure (DLQ):

Bash

node queuectl.js dlq list
(Should show job-fail)

Stop the Worker:

Bash

node queuectl.js worker stop
Contact
For questions or support, please connect with me:

Raj Srivastava (GitHub)
