FROM python:3.12-slim
RUN apt-get update && \
    apt-get install -y nginx && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY build/ui/index.html /app/ui/index.html
COPY backend/nginx.conf /etc/nginx/nginx.conf
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
