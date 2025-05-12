#!/usr/bin/env bash
# start-all.sh  —  start Plumber API, Flask proxy, and React dev-server in one go

# 1) Start Plumber API in background
echo "Starting Plumber API on port 8000..."
(cd src/r_service && Rscript -e "pr <- plumber::plumb('api.R'); pr\$run(host='0.0.0.0', port=8000)" &)

# 2) Start Flask proxy in background
echo "Starting Flask proxy on port 5000..."
(cd src/backend && python app.py &)

# 3) Start React dev-server (foreground so you can see logs)
echo "Starting React dev-server on port 3000..."
(cd frontend && npm start)