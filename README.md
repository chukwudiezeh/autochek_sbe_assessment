# Autochek Backend Test

A comprehensive NestJS application for vehicle valuation and financing services.

## Quick Start Guide

### Option 1: Run with Docker

1. **Clone/Download** this code structure

2. **Set up environment:**
   ```bash
   cp .env.sample .env
   # Edit .env file with your configuration
   ```

3. **Run with Docker:**
   ```bash
   # Start - using a custom command
   npm run docker:start

   # Stop
   npm run docker:stop
   ```

4. **Access the application:**
   - API: http://localhost:3000
   

### Option 2: Run Locally

1. **Clone/Download** this code structure

2. **Set up environment:**
   ```bash
   cp .env.sample .env
   # Edit .env file with your configuration
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the application:**
   ```bash
   npm run start:dev
   ```

5. **Seed sample data:**
   ```bash
   npm run seed
   ```

6. **Access the application:**
   - API: http://localhost:3000


## API Documentation

Once the application is running, you can access:

- **Swagger Documentation**: http://localhost:3000/docs

## Key Features Implemented

[✓] TypeORM with SQLite database
[✓] RESTful API endpoints
[✓] Vehicle data ingestion with validation
[✓] VIN lookup integration (with fallback simulation)
[✓] Automated vehicle valuation
[✓] Loan eligibility checks (LTV, DTI, income, employment, vehicle age)
[✓] Automatic loan offer generation (3 options per approval)
[✓] Comprehensive error handling
[✓] Input validation with class-validator
[✓] Swagger API documentation
[✓] Database seeding script
[✓] E2E tests
[✓] Logging
[✓] Docker containerization
[✓] Clean, documented code


## Testing

```bash
# Local testing
npm run test
npm run test:e2e

# Docker testing
docker-compose exec app npm run test
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 6379, and 80 are available
2. **Docker permissions**: Ensure Docker daemon is running
3. **Environment variables**: Check your `.env` file configuration


