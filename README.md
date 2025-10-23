# Real-time Fraud Detection System

A distributed, event-driven fraud detection system built with Node.js, Apache Kafka, and Redis. This system processes financial transactions in real-time and detects suspicious activities using multiple fraud detection rules.

## 🏗️ Architecture

The system follows a microservices architecture with three main components:
```
┌─────────────────┐
│  Transaction    │  ← User sends transaction
│    Service      │
│  (Express API)  │
└────────┬────────┘
         │
         ↓
    ┌────────┐
    │ Kafka  │ ← transactions topic
    └────┬───┘
         │
         ↓
┌─────────────────┐      ┌────────┐
│ Fraud Detection │ ←───→│ Redis  │ ← State management
│    Service      │      └────────┘
└────────┬────────┘
         │
         ↓
    ┌────────┐
    │ Kafka  │ ← fraud-alerts topic
    └────┬───┘
         │
         ↓
┌─────────────────┐
│  Alert Service  │ ← Notifications
└─────────────────┘
```

## ✨ Features

- **Real-time Transaction Processing**: Processes transactions as they occur
- **Multiple Fraud Detection Rules**:
  - Large transaction detection (> $10,000)
  - Rapid transaction detection (5+ transactions in 30 seconds)
  - Unusual location change detection
- **Distributed Architecture**: Scalable microservices using Kafka for event streaming
- **State Management**: Redis for fast in-memory state tracking
- **Monitoring Dashboard**: Kafka UI for real-time system monitoring

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - REST API framework
- **Apache Kafka** - Event streaming platform
- **Redis** - In-memory data store
- **Docker** - Containerization
- **KafkaJS** - Kafka client for Node.js

## 📋 Prerequisites

Before running this project, ensure you have:

- **Docker** and **Docker Compose** installed
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- Ports available: 3000, 6379, 8080, 9094

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/tarungatla/BDA_Project.git
cd BDA_Project
```

### 2. Install Dependencies
```bash
npm install
```

Required packages:
- `kafkajs` - Kafka client
- `redis` - Redis client
- `express` - Web framework

### 3. Start Infrastructure Services

Launch Kafka, Redis, and Kafka UI using Docker Compose:
```bash
docker-compose up -d
```

Wait 30-60 seconds for Kafka to fully initialize. Check status:
```bash
docker-compose ps
```

### 4. Start Application Services

Open three separate terminal windows:

**Terminal 1 - Transaction Service:**
```bash
node transaction-service.js
```

**Terminal 2 - Fraud Detection Service:**
```bash
node fraud-detection-service.js
```

**Terminal 3 - Alert Service:**
```bash
node alert-service.js
```

## 🧪 Testing the System

### Test 1: Large Transaction Detection

Send a transaction over $10,000:
```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 15000,
    "currency": "USD",
    "location": "New York"
  }'
```

**Expected Result**: Fraud alert triggered for "Large Transaction Detected"

### Test 2: Rapid Transaction Detection

Send 5 transactions within 30 seconds:
```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/transactions \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "user456",
      "amount": 100,
      "currency": "USD",
      "location": "London"
    }'
  sleep 2
done
```

**Expected Result**: Fraud alert triggered for "Multiple Rapid Transactions Detected"

### Test 3: Location Change Detection

Send two transactions from different locations:
```bash
# First transaction
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user789",
    "amount": 500,
    "currency": "USD",
    "location": "Paris"
  }'

# Second transaction - different location
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user789",
    "amount": 600,
    "currency": "USD",
    "location": "Tokyo"
  }'
```

**Expected Result**: Fraud alert triggered for "Unusual Location Change Detected"

### Test 4: Normal Transaction

Send a normal transaction (should not trigger alerts):
```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user999",
    "amount": 50,
    "currency": "USD",
    "location": "Berlin"
  }'
```

**Expected Result**: No fraud alerts

## 📊 Monitoring

### Kafka UI Dashboard

Access the Kafka UI at: **http://localhost:8080**

Features:
- View topics: `transactions` and `fraud-alerts`
- Monitor message throughput
- Inspect message contents
- Check consumer group lag
- View broker status

### Redis Insight

Access Redis Insight at: **http://localhost:8001**

Features:
- View user transaction history
- Inspect timestamps and location data
- Monitor key-value pairs

## 🔧 Configuration

### Kafka Configuration

Edit `docker-compose.yml` to modify:
- Number of partitions (default: 3 for transactions, 5 for fraud-alerts)
- Replication factor
- Port mappings

### Redis Configuration

Default password: `canremember`

To change, update in:
- `docker-compose.yml` (REDIS_ARGS)
- `fraud-detection-service.js` (Redis client URL)
- `transaction-service.js` (Redis client URL)

### Fraud Detection Rules

Modify rules in `fraud-detection-service.js`:
```javascript
// Adjust threshold for large transactions
if (amount > 10000) { ... }

// Adjust time window for rapid transactions
if (differenceInTimestamps <= 30000) { ... }
```

## 🛑 Stopping the System

### Stop Node.js Services

Press `Ctrl+C` in each terminal running the services.

### Stop Docker Containers
```bash
docker-compose down
```

### Clean Up (Remove Volumes)
```bash
docker-compose down -v
```

## 🐛 Troubleshooting

### Issue: "Cannot connect to Kafka"

**Solution**: Wait 30-60 seconds after starting Docker Compose. Kafka needs time to initialize.
```bash
docker-compose logs -f kafka
```

### Issue: "Redis connection refused"

**Solution**: Ensure Redis container is running and check the password.
```bash
docker-compose ps redis
```

### Issue: Port already in use

**Solution**: Check if ports are available:
```bash
# Check port usage
lsof -i :3000  # Transaction service
lsof -i :9094  # Kafka
lsof -i :6379  # Redis
lsof -i :8080  # Kafka UI
```

### Issue: No fraud alerts appearing

**Solution**: 
1. Verify all three services are running
2. Check Kafka UI to ensure messages are being produced
3. Review console logs for errors

## 📝 API Documentation

### POST /api/v1/transactions

Create a new transaction.

**Request Body:**
```json
{
  "userId": "string (required)",
  "amount": "number (required)",
  "currency": "string (required)",
  "location": "string (required)"
}
```

**Response:**
```json
{
  "transactionId": "uuid"
}
```

**Status Codes:**
- `200` - Transaction processed successfully
- `400` - Missing required fields

## 📄 License

This project is open source and available under the MIT License.
