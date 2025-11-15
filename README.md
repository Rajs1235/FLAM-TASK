Here is your `README.md` file, edited to show the CLI commands in a table format as you requested. I've also cleaned up some of the spacing and formatting (like the `<br>` tags) to make it look more professional.

-----

# QUEUECTL (Node.js Version)

## Overview

QUEUECTL is a comprehensive, CLI-based background job queue system designed to manage a distributed task pipeline. The system is built with a powerful Node.js backend and MongoDB for persistent storage.

It's a minimal, production-grade system that supports enqueuing jobs, running multiple concurrent worker processes, handling automatic retries with exponential backoff, and maintaining a Dead Letter Queue (DLQ) for permanently failed jobs.

## Features

### ⚙️ System Features

  * **Persistent Job Storage**: All job states and metadata are stored in MongoDB, ensuring data survives restarts.
  * **Concurrent Workers**: Run multiple, parallel worker processes using `child_process.fork` to process jobs at scale.
  * **Atomic Job Locking**: Prevents race conditions and duplicate job execution. Workers use atomic `findOneAndUpdate` operations to "lock" a job before processing.
  * **Exponential Backoff**: Failed jobs are automatically retried. The delay between retries increases exponentially (`delay = base ^ attempts`) to avoid overwhelming failing services.
  * **Dead Letter Queue (DLQ)**: After exhausting all `max_retries`, jobs are moved to a `dead` state (the DLQ) for manual review.
  * **Graceful Shutdown**: Workers listen for `SIGTERM` signals (from `worker stop`) to finish their current job before exiting, preventing data corruption.

### 💻 CLI Commands

| Category | Command Example | Description |
| :--- | :--- | :--- |
| **Enqueue** | `node queuectl.js enqueue "..."` | Add a new job to the queue with a specific command. |
| **Workers** | `node queuectl.js worker start --count 3`| Start one or more background worker processes. |
| **Workers** | `node queuectl.js worker stop` | Send a graceful shutdown signal to all running workers. |
| **Status** | `node queuectl.js status` | Get a high-level summary of all job states. |
| **List Jobs** | `node queuectl.js list --state pending` | List jobs by their state (e.g., `pending`, `completed`). |
| **DLQ** | `node queuectl.js dlq list` | View all jobs in the Dead Letter Queue. |
| **DLQ** | `node queuectl.js dlq retry <job-id>` | Manually re-queue a specific job from the DLQ. |
| **Config** | `node queuectl.js config set <key> <value>` | Set global configurations, like `default_max_retries`. |

### Technology Stack & Architecture

The application is architected with a modern Node.js backend designed for a CLI environment.

#### ✔️ Backend (CLI & Workers):

  * The core application is built with **Node.js**.
  * **`commander`** is used to build the user-friendly, Git-like CLI interface (`queuectl.js`).
  * **`child_process.fork`** is used to spawn worker processes in the background.
  * **`fs-extra`** is used to manage a `.pids` file, allowing the `stop` command to know which processes to signal.
  * The CLI logic is organized into `controllers/commandController.js` for clear separation of concerns.

#### 📦 Database:

  * **MongoDB** serves as the persistent, central datastore for all jobs.
  * **Mongoose** is used as the Object Data Modeler (ODM) to define schemas (`Job.js`, `Config.js`) and interact with the database.

#### 🛒 Core Architecture:

  * **`queuectl.js`**: The main CLI entry point. It parses commands and routes them to the controller.
  * **`controllers/`**: Contains all the business logic for each CLI command. It's responsible for interacting with the database and managing worker processes.
  * **`db/index.js`**: Manages the database connection pool.
  * **`models/`**: Defines the Mongoose schemas for `Job` and `Config`.
  * **`lib/worker.js`**: A standalone script that runs as a separate, background process. It polls MongoDB for work, executes jobs atomically using `child_process.spawn`, and handles the complete retry/backoff/DLQ logic.

-----

## 📝 Robustness & Design

The application is built with a strong emphasis on robustness and correctness.

### Concurrency Control:

The primary challenge in a job queue is preventing two workers from grabbing the same job. This is solved by using a single, **atomic `findOneAndUpdate` operation**. This query finds a due job and simultaneously updates its `state` to `processing`, making it invisible to other workers in a single, un-interruptible database operation.

### Process Management:

Workers are launched as detached background processes. Their Process IDs (PIDs) are stored in a `.pids` file.

The `worker stop` command reads this file and sends a `SIGTERM` signal to each PID, allowing for a graceful shutdown. This is a simple file-based solution suitable for a single-machine deployment.

### 🔒Secure Credentials Management:

All sensitive credentials (like the `MONGO_URI`) are managed via environment variables and loaded securely using the `dotenv` package. They are never hard-coded.

-----

## Local Installation & Setup

### Prerequisites

  * **Node.js**: v16 or later
  * **MongoDB**: A running MongoDB instance. This can be local (`mongodb://127.0.0.1:27017`) or a free **MongoDB Atlas** cluster.

### Local Setup

1.  **Clone the Repository**
    Open your terminal and clone the project repository:

    ```bash
    git clone https://github.com/Rajs1235/FLAM-TASK.git
    cd FLAM-TASK
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**

      * Create a new file in the root directory named `.env`.
      * Add your MongoDB connection string to this file.

    <!-- end list -->

    ```env
    # In .env
    MONGO_URI="mongodb+srv://<user>:<password>@your-cluster.mongodb.net/queuectl"
    ```

      * **Important:** If using MongoDB Atlas, make sure you have **whitelisted your IP address** in the "Network Access" tab of your cluster.

4.  **Run the Application**
    All commands are run from the terminal using `node queuectl.js <command>`. This is the most reliable way to run the tool and avoids system-specific `npm link` issues.

    ```bash
    # Check if the connection is working
    node queuectl.js status
    ```

-----

## 🧪 Testing Flow

You can manually test the entire job lifecycle.

1.  **Check Status (should be empty):**
    ```bash
    node queuectl.js status
    ```
2.  **Start a Worker:**
    ```bash
    node queuectl.js worker start --count 1
    ```
3.  **Enqueue a Successful Job (Windows cmd.exe syntax):**
    ```bash
    node queuectl.js enqueue "{\"id\":\"job-ok\",\"command\":\"echo This will succeed\"}"
    ```
4.  **Enqueue a Failing Job:**
    ```bash
    node queuectl.js enqueue "{\"id\":\"job-fail\",\"command\":\"exit 1\"}"
    ```
5.  **Wait 20-30 seconds** for the worker to process both jobs (including all retries for the failing one).
6.  **Verify Success:**
    ```bash
    node queuectl.js list --state completed
    ```
    *(Should show `job-ok`)*
7.  **Verify Failure (DLQ):**
    ```bash
    node queuectl.js dlq list
    ```
    *(Should show `job-fail`)*
8.  **Stop the Worker:**
    ```bash
    node queuectl.js worker stop
    ```

-----

## Contact

For questions or support, please connect with me:

  * [Raj Srivastava](https://www.google.com/search?q=httpss://github.com/Rajs1235) (GitHub)
