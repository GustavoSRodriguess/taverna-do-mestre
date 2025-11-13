#!/bin/bash

# Deploy script para Azure - Taverna do Mestre
# Usage: ./scripts/deploy-azure.sh [dev|prod]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="taverna-rg"
LOCATION="brazilsouth"
ACR_NAME="tavernaacr"

# Get environment (dev or prod)
ENV=${1:-dev}

echo -e "${GREEN}🚀 Deploying Taverna do Mestre to Azure (${ENV})...${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure. Running 'az login'...${NC}"
    az login
fi

# Load environment variables
if [ -f .env.azure ]; then
    echo -e "${GREEN}✓ Loading .env.azure${NC}"
    export $(cat .env.azure | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env.azure not found. Please create it from .env.azure.example${NC}"
    exit 1
fi

# Step 1: Create Resource Group
echo -e "${GREEN}📦 Creating Resource Group...${NC}"
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    || echo -e "${YELLOW}Resource group already exists${NC}"

# Step 2: Create Container Registry
echo -e "${GREEN}🐳 Creating Container Registry...${NC}"
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    || echo -e "${YELLOW}ACR already exists${NC}"

# Login to ACR
echo -e "${GREEN}🔐 Logging into ACR...${NC}"
az acr login --name $ACR_NAME

# Step 3: Build and Push Images
echo -e "${GREEN}🏗️  Building and pushing Docker images...${NC}"

# Backend
echo "  → Backend..."
docker build -t ${ACR_NAME}.azurecr.io/taverna-backend:latest \
    -t ${ACR_NAME}.azurecr.io/taverna-backend:${ENV} \
    ./backend
docker push ${ACR_NAME}.azurecr.io/taverna-backend:latest
docker push ${ACR_NAME}.azurecr.io/taverna-backend:${ENV}

# AI Service
echo "  → AI Service..."
docker build -t ${ACR_NAME}.azurecr.io/taverna-ai:latest \
    -t ${ACR_NAME}.azurecr.io/taverna-ai:${ENV} \
    ./ai-service
docker push ${ACR_NAME}.azurecr.io/taverna-ai:latest
docker push ${ACR_NAME}.azurecr.io/taverna-ai:${ENV}

# Frontend
echo "  → Frontend..."
docker build -t ${ACR_NAME}.azurecr.io/taverna-frontend:latest \
    -t ${ACR_NAME}.azurecr.io/taverna-frontend:${ENV} \
    --build-arg VITE_API_URL=${VITE_API_URL} \
    ./frontend
docker push ${ACR_NAME}.azurecr.io/taverna-frontend:latest
docker push ${ACR_NAME}.azurecr.io/taverna-frontend:${ENV}

# Step 4: Create PostgreSQL (if not exists)
echo -e "${GREEN}🗄️  Setting up PostgreSQL...${NC}"
DB_NAME="taverna-db-${ENV}"

az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_NAME \
    --location $LOCATION \
    --admin-user tavernaadmin \
    --admin-password "${DB_PASSWORD}" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 15 \
    || echo -e "${YELLOW}Database already exists${NC}"

# Create database
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $DB_NAME \
    --database-name rpg_saas \
    || echo -e "${YELLOW}Database already exists${NC}"

# Allow Azure services
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_NAME \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    || echo -e "${YELLOW}Firewall rule already exists${NC}"

# Step 5: Run Migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
DB_CONNECTION="host=${DB_HOST} port=5432 dbname=rpg_saas user=tavernaadmin password=${DB_PASSWORD} sslmode=require"

psql "$DB_CONNECTION" -f db/init.sql || echo -e "${YELLOW}Migration already applied${NC}"
psql "$DB_CONNECTION" -f db/migration_add_is_homebrew.sql || echo -e "${YELLOW}Migration already applied${NC}"
psql "$DB_CONNECTION" -f db/migration_add_is_unique_to_pcs.sql || echo -e "${YELLOW}Migration already applied${NC}"
psql "$DB_CONNECTION" -f db/homebrew_tables.sql || echo -e "${YELLOW}Migration already applied${NC}"
psql "$DB_CONNECTION" -f db/homebrew_favorites_ratings.sql || echo -e "${YELLOW}Migration already applied${NC}"

# Step 6: Create App Service Plan
echo -e "${GREEN}📱 Creating App Service Plan...${NC}"
PLAN_NAME="taverna-plan-${ENV}"

az appservice plan create \
    --resource-group $RESOURCE_GROUP \
    --name $PLAN_NAME \
    --is-linux \
    --sku B1 \
    || echo -e "${YELLOW}App Service Plan already exists${NC}"

# Step 7: Create Web App
echo -e "${GREEN}🌐 Creating Web App...${NC}"
APP_NAME="taverna-do-mestre-${ENV}"

az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --name $APP_NAME \
    --multicontainer-config-type compose \
    --multicontainer-config-file docker-compose.azure.yml \
    || echo -e "${YELLOW}Web App already exists${NC}"

# Step 8: Configure App Settings
echo -e "${GREEN}⚙️  Configuring app settings...${NC}"
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        DB_HOST="${DB_HOST}" \
        DB_PORT="5432" \
        DB_USER="tavernaadmin" \
        DB_PASSWORD="${DB_PASSWORD}" \
        DB_NAME="rpg_saas" \
        JWT_SECRET="${JWT_SECRET}" \
        OPENAI_API_KEY="${OPENAI_API_KEY}" \
        VITE_API_URL="${VITE_API_URL}" \
        DOCKER_REGISTRY="${ACR_NAME}.azurecr.io" \
        ENVIRONMENT="${ENV}"

# Step 9: Configure ACR Credentials
echo -e "${GREEN}🔑 Configuring ACR credentials...${NC}"
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

az webapp config container set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --docker-registry-server-url https://${ACR_NAME}.azurecr.io \
    --docker-registry-server-user $ACR_NAME \
    --docker-registry-server-password $ACR_PASSWORD

# Step 10: Enable HTTPS
echo -e "${GREEN}🔒 Enabling HTTPS...${NC}"
az webapp update \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --set httpsOnly=true

# Step 11: Restart App
echo -e "${GREEN}🔄 Restarting app...${NC}"
az webapp restart \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME

# Step 12: Get URL
APP_URL=$(az webapp show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query defaultHostName -o tsv)

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${GREEN}🌐 Your app is available at: https://${APP_URL}${NC}"
echo -e "${YELLOW}⏳ Please wait a few minutes for the containers to start...${NC}"

# Health check
echo -e "${GREEN}🏥 Running health check...${NC}"
sleep 30
if curl -f https://${APP_URL}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed. Please check the logs:${NC}"
    echo "   az webapp log tail --resource-group ${RESOURCE_GROUP} --name ${APP_NAME}"
fi
