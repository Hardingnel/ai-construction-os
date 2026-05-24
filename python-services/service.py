import uvicorn
import os
import signal
import sys

if __name__ == "__main__":
    port = int(os.getenv("PYTHON_API_PORT", "8000"))
    reload_mode = os.getenv("PYTHON_RELOAD", "false").lower() == "true"

    config = uvicorn.Config(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=reload_mode,
        log_level=os.getenv("LOG_LEVEL", "info"),
        workers=1,
    )
    server = uvicorn.Server(config)

    def shutdown(sig, frame):
        print(f"AI Python Service: Received signal {sig}, shutting down...")
        server.should_exit = True
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    print(f"AI Python Service starting on port {port} (reload={reload_mode})")
    server.run()
