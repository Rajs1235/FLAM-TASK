# QUEUECTL : A Node.js & MongoDB CLI Job Queue
This is a CLI-based background job queue system built with Node.js and MongoDB for a backend developer internship assignment.

It's a minimal, production-grade system that manages background jobs with concurrent worker processes, handles automatic retries using exponential backoff, and maintains a Dead Letter Queue (DLQ) for permanently failed jobs.

# 💻 Tech Stack
Category	Technologies
Core	<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/> <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/>
Database	<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/> <img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose"/>
Tools & CLI	<img src="https://img.shields.io/badge/Commander.js-000000?style=for-the-badge&logo=npm&logoColor=white" alt="Commander.js"/> <img src="https://img.shields.io/badge/fs--extra-1572B6?style=for-the-badge&logo=files&logoColor=white" alt="fs-extra"/> <img src="https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black" alt="dotenv"/>
# ✨ Key Features
Persistent Job Storage: All jobs are stored in MongoDB.

Concurrent Worker Processes: Run multiple, parallel workers using child_process.fork.

Atomic Job Locking: Prevents race conditions and duplicate job processing using atomic findOneAndUpdate operations.

Exponential Backoff: Automatically retries failed jobs with a delay of base ^ attempts seconds.

Dead Letter Queue (DLQ): Failed jobs are moved to a dead state after exhausting all retries.

Graceful Shutdown: Workers listen for SIGTERM to finish their current job before exiting.

Bonus Web Dashboard: Includes an optional Express.js API (index.js/app.js) for a monitoring dashboard.

# 🚀 How to Run Locally
Prerequisites:

Node.js (v16+ recommended)

MongoDB (A running instance, e.g., MongoDB Atlas or local mongodb://127.0.0.1)

Clone the repository:

Bash

git clone https://github.com/Rajs1235/FLAM-TASK.git
cd FLAM-TASK
Install dependencies:

Bash

npm install
Set up Environment Variables:

Create a .env file in the root directory.

Add your MongoDB connection string:

Code snippet

MONGO_URI="mongodb+srv://<user>:<password>@your-cluster.mongodb.net/queuectl"
Run the Application:

All commands are run from the terminal using node queuectl.js <command>.

# 💻 CLI Commands
Category	Command	Description
Enqueue	node queuectl.js enqueue "..."	Add a new job to the queue.
Workers	node queuectl.js worker start --count 3	Start one or more background workers.
Workers	node queuectl.js worker stop	Stop all running workers gracefully.
Status	node queuectl.js status	Show summary of all job states & active workers.
List Jobs	node queuectl.js list --state pending	List jobs by state (pending, completed, etc.)
DLQ	node queuectl.js dlq list	View all jobs in the Dead Letter Queue.
DLQ	node queuectl.js dlq retry <job-id>	Retry a specific job from the DLQ.
Config	node queuectl.js config set <key> <value>	Manage configuration (e.g., default_max_retries 5).

Export to Sheets

Note on Windows (cmd.exe): You must escape the double quotes inside the JSON string.

Bash

# Correct syntax for Windows Command Prompt:
node queuectl.js enqueue "{\"id\":\"job1\",\"command\":\"echo Hello\"}"
🧪 Test Flow
You can manually test the entire job lifecycle.

Check Status (should be empty):

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
# 📫 Author: Raj Srivastava
<p align="left"> <a href="mailto:raj25oct2003@gmail.com" target="_blank"> <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/> </a> <a href="https://www.linkedin.com/in/raj-srivastava-a7337322a/" target="_blank"> <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/> </a> <a href="https://github.com/Rajs1235" target="_blank"> <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/> </a> </p>
