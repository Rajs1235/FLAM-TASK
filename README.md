# QueueCTL - A Node.js & MongoDB Background Job Queue
A minimal, production-grade CLI tool for managing background jobs. It supports concurrent workers, persistent job storage (MongoDB), automatic retries with exponential backoff, and a Dead Letter Queue (DLQ) for failed jobs. This was created as a backend developer internship assignment.

# 🚀 Tech Stack
Core: Node.js

# Database: MongoDB (with Mongoose)

# CLI Framework: commander

# Process Management: child_process.fork

# Utilities: dotenv, chalk, fs-extra

# ✨ Key Features
# Persistent Jobs: All jobs are stored in MongoDB.

# Concurrent Workers: Run multiple worker processes in parallel.

# Atomic Operations: Prevents duplicate job processing (race conditions) using atomic findOneAndUpdate.

# Retry & Backoff: Automatically retries failed jobs with an exponential backoff (delay = base ^ attempts).

# Dead Letter Queue (DLQ): Jobs that exhaust all retries are moved to a dead state.

# Graceful Shutdown: Workers catch SIGTERM signals to finish their current job before exiting.

# Configurable: Manage settings like retry counts via the CLI.

# Bonus: Scheduled Jobs: Supports a run_at field during enqueue for scheduled jobs.

# Bonus: Web Dashboard: Includes an optional Express.js API (in app.js and index.js) for a web-based monitoring dashboard.

# ⚙️ Setup Instructions
Follow these steps to get queuectl running on your local machine.

1. Prerequisites
Node.js (v16+ recommended)

MongoDB (A running instance, e.g., MongoDB Atlas or local mongodb://127.0.0.1)

2. Clone the repository
Bash

git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
3. Install dependencies
Bash

npm install
4. Set up Environment Variables
Create a .env file in the root directory.

Add your MongoDB connection string to it:

Code snippet

MONGO_URI="mongodb+srv://<user>:<password>@your-cluster.mongodb.net/queuectl"
5. How to Run Commands
All commands are run from the terminal using node queuectl.js <command>.

# 💻 Usage Examples (CLI Commands)
Enqueue a Job
Note: Windows Command Prompt (cmd.exe) requires escaping the double quotes.

Bash

node queuectl.js enqueue "{\"id\":\"job1\",\"command\":\"echo Hello\"}"
Manage Workers
Bash

# Start 3 workers in the background
node queuectl.js worker start --count 3

# Stop all running workers
node queuectl.js worker stop
Check Status
Bash

node queuectl.js status
List Jobs by State
Bash

node queuectl.js list --state pending
node queuectl.js list --state completed
Manage the DLQ
Bash

# List all failed jobs
node queuectl.js dlq list

# Retry a specific failed job
node queuectl.js dlq retry job1
Manage Configuration
Bash

node queuectl.js config set default_max_retries 5
🏗️ Architecture Overview
queuectl.js: The main CLI entry point, using commander to parse commands and route them to the controller.

controllers/: Contains all the business logic for each CLI command. It's responsible for interacting with the database and managing worker processes.

models/ & db/: Defines the Mongoose schemas (Job, Config) and manages the database connection pool.

lib/worker.js: A standalone script that runs as a separate, background process. It polls the database for work, executes jobs atomically, and handles the complete retry/backoff/DLQ logic.

Job Lifecycle: pending ➔ processing ➔ completed (on success) OR failed (on error). After max retries, failed ➔ dead.

🧪 Testing Instructions
You can manually test the entire job lifecycle.

Check Status: (Should be empty)

Bash

node queuectl.js status
Start a Worker:

Bash

node queuectl.js worker start --count 1
Enqueue a Successful Job:

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
💡 Assumptions & Trade-offs
Process Management: Workers are launched as detached background processes. Their PIDs are stored in a local .pids file for the stop command. This is simple but not robust enough for a multi-machine setup (which would require a shared store like Redis).

Command Execution: The command string is executed with shell: true, which is powerful but requires trusting the input.

CLI Execution: The recommended way to run the tool is node queuectl.js <command> to avoid any system path/npm link issues.
