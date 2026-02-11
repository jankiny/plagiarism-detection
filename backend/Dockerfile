# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Configure apt mirror (USTC)
RUN sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    poppler-utils \
    tesseract-ocr \
    libtesseract-dev \
    libleptonica-dev \
    pkg-config \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip -i https://mirrors.ustc.edu.cn/pypi/web/simple --trusted-host mirrors.ustc.edu.cn \
    && pip install -r requirements.txt -i https://mirrors.ustc.edu.cn/pypi/web/simple --trusted-host mirrors.ustc.edu.cn

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Run the application
# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Create a startup script to handle database initialization
RUN echo '#!/bin/bash\n\n# Run database migrations and seeding first\npython -m app.core.database_seed\n\n# Then start the application\ngunicorn -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --workers 4 --worker-class uvicorn.workers.UvicornWorker --timeout 120 app.main:app' > /app/startup.sh && chmod +x /app/startup.sh

# Run the application with the startup script
CMD ["/app/startup.sh"]