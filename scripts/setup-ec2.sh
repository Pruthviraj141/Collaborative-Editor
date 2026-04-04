#!/usr/bin/env bash
set -euo pipefail

echo "[1/8] Updating apt package index..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "[2/8] Installing prerequisites for Docker repository..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release

echo "[3/8] Adding official Docker GPG key and repository..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "[4/8] Installing Docker Engine and Compose plugin..."
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "[5/8] Adding ubuntu user to docker group..."
sudo usermod -aG docker ubuntu

echo "[6/8] Installing Certbot + nginx plugin..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "[7/8] Preparing app directory and env placeholder..."
sudo mkdir -p /home/ubuntu/app
sudo chown -R ubuntu:ubuntu /home/ubuntu/app

if [ ! -f /home/ubuntu/app/.env.production ]; then
  cat <<'EOF' > /home/ubuntu/app/.env.production
# Production environment variables for Docker Compose
# Fill this file with real values before first deploy.
# You can start from .env.production.example in the repository.

NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://pruthvi.tech
NEXT_PUBLIC_HOCUSPOCUS_URL=wss://pruthvi.tech/collab
NEXT_PUBLIC_WS_URL=wss://pruthvi.tech/collab
NEXT_PUBLIC_SOCKET_URL=wss://pruthvi.tech/collab

# Add the rest of required values here...
EOF
fi

echo "[8/8] Enabling and starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "✅ EC2 setup complete."
echo "Next steps:"
echo "1) Re-login (or run: newgrp docker) so docker group membership is active."
echo "2) Clone the repository into /home/ubuntu/app."
echo "3) Fill /home/ubuntu/app/.env.production with real values."
echo "4) Place SSL cert files at /home/ubuntu/app/nginx/ssl/fullchain.pem and privkey.pem."
echo "5) Run: docker compose up -d --build"
