FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 9000

ENV OLLAMA_HOST=http://host.docker.internal:11434
ENV OLLAMA_MODEL=mistral

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:9000", "--workers", "2", "--timeout", "300", "app:app"]
