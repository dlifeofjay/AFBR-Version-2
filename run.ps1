# Stop and remove existing containers if they exist
docker rm -f afbr-backend afbr-frontend

# Create a network (optional, but good practice)
docker network create afbr-net

# 1. Run Backend
Write-Host "Starting Backend..."
docker run -d --name afbr-backend `
  --network afbr-net `
  -p 8000:8000 `
  --env-file .env `
  -v ${PWD}/app:/app/app `
  afbr-backend:latest

# 2. Run Frontend
Write-Host "Starting Frontend..."
docker run -d --name afbr-frontend `
  --network afbr-net `
  -p 3000:80 `
  afbr-frontend:latest

Write-Host "App started!"
Write-Host "Backend: http://localhost:8000/docs"
Write-Host "Frontend: http://localhost:3000"
