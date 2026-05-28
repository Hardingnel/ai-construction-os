import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';
const PYTHON_SCRIPT = process.env.PYTHON_SCRIPT || path.resolve(__dirname, '../../../python-services/service.py');
const PYTHON_PORT = parseInt(process.env.PYTHON_API_PORT || '8000', 10);
const HEALTH_CHECK_INTERVAL = parseInt(process.env.PYTHON_HEALTH_INTERVAL || '15000', 10);
const MAX_RETRIES = parseInt(process.env.PYTHON_MAX_RETRIES || '5', 10);
const RETRY_DELAY_BASE = parseInt(process.env.PYTHON_RETRY_DELAY || '2000', 10);

type PythonStatus = 'starting' | 'running' | 'stopped' | 'error';

interface PythonServiceState {
  status: PythonStatus;
  pid: number | null;
  healthy: boolean;
  uptime: number;
  retryCount: number;
  lastError: string | null;
  lastHealthCheck: string | null;
}

class PythonServiceManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private healthInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: number = 0;
  private retryCount: number = 0;
  private stopped: boolean = false;

  state: PythonServiceState = {
    status: 'stopped',
    pid: null,
    healthy: false,
    uptime: 0,
    retryCount: 0,
    lastError: null,
    lastHealthCheck: null,
  };

  constructor() {
    super();
  }

  async start(): Promise<void> {
    if (this.process) {
      console.log('Python service: already running');
      return;
    }

    this.stopped = false;
    this.retryCount = 0;
    this.setState({ status: 'starting' });
    this.spawnProcess();

    this.healthInterval = setInterval(() => this.checkHealth(), HEALTH_CHECK_INTERVAL);
  }

  private spawnProcess(): void {
    const scriptPath = PYTHON_SCRIPT;
    console.log(`Python service: starting from ${scriptPath}`);

    try {
      this.process = spawn('python', [scriptPath], {
        cwd: path.dirname(path.dirname(scriptPath)),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHON_API_PORT: String(PYTHON_PORT),
          PYTHON_RELOAD: 'false',
        },
      });

      this.startTime = Date.now();
      this.setState({
        pid: this.process.pid || null,
        lastError: null,
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg) console.log(`[Python AI] ${msg}`);
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg) {
          if (msg.includes('Error') || msg.includes('Traceback') || msg.includes('ERROR')) {
            console.error(`[Python AI ERROR] ${msg}`);
            this.setState({ lastError: msg });
          } else {
            console.log(`[Python AI] ${msg}`);
          }
        }
      });

      this.process.on('exit', (code, signal) => {
        const pid = this.process?.pid;
        console.log(`Python service: exited (code=${code}, signal=${signal}, pid=${pid})`);
        this.process = null;
        this.setState({ pid: null, healthy: false, status: 'stopped' });

        if (!this.stopped && this.retryCount < MAX_RETRIES) {
          this.retryCount++;
          const delay = RETRY_DELAY_BASE * Math.pow(1.5, this.retryCount - 1);
          console.log(`Python service: restarting in ${delay}ms (attempt ${this.retryCount}/${MAX_RETRIES})`);
          this.setState({ status: 'starting', retryCount: this.retryCount });
          setTimeout(() => this.spawnProcess(), delay);
        } else if (!this.stopped) {
          console.error(`Python service: max retries (${MAX_RETRIES}) reached. Giving up.`);
          this.setState({ status: 'error', lastError: `Max retries (${MAX_RETRIES}) exceeded` });
        }
      });

      this.process.on('error', (err) => {
        console.error(`Python service: process error: ${err.message}`);
        this.setState({ lastError: err.message });
      });
    } catch (err: any) {
      console.error(`Python service: failed to spawn: ${err.message}`);
      this.setState({ status: 'error', lastError: err.message });
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(`${PYTHON_API_URL}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json() as { status?: string };
        const healthy = data?.status === 'ok';
        this.setState({
          healthy,
          status: healthy ? 'running' : this.state.status,
          lastHealthCheck: new Date().toISOString(),
          uptime: Date.now() - this.startTime,
        });
        if (healthy && !this.state.healthy) {
          console.log('Python service: health check OK');
          this.emit('healthy');
        }
        return healthy;
      }
      this.setState({ healthy: false, lastHealthCheck: new Date().toISOString() });
      return false;
    } catch {
      this.setState({ healthy: false });
      return false;
    }
  }

  isHealthy(): boolean {
    return this.state.healthy;
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
    if (this.process) {
      console.log('Python service: stopping...');
      this.process.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (this.process) {
        this.process.kill('SIGKILL');
      }
      this.process = null;
    }
    this.setState({ status: 'stopped', pid: null, healthy: false });
    console.log('Python service: stopped');
  }

  private setState(partial: Partial<PythonServiceState>): void {
    this.state = { ...this.state, ...partial };
    this.emit('stateChange', this.state);
  }
}

export const pythonService = new PythonServiceManager();
