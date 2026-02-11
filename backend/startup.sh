#!/bin/bash

# Run database migrations and seeding first
python -m app.core.database_seed

# Then start the application
gunicorn -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --workers 4 --worker-class uvicorn.workers.UvicornWorker --timeout 120 app.main:app
