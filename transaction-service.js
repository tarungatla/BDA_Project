const crypto = require("crypto");
const express = require("express");
const { Kafka, Partitioners } = require("kafkajs");
const redis = require("redis");

const app = express();
const PORT = 3001;

const kafka = new Kafka({
  clientId: "fraud-detection-producer",
  brokers: ["localhost:9094"],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

const redisClient = redis.createClient({
  url: "redis://:canremember@localhost:6379",
});

app.use(express.json());

async function init() {
  await producer.connect();
  await redisClient.connect();
  console.log("✅ Connected to Kafka and Redis");
}

app.post("/api/v1/transactions", async (req, res) => {
  const { userId, amount, currency, location } = req.body;

  if (!userId || !amount || !currency || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const transaction = {
    id: crypto.randomUUID(),
    userId,
    amount,
    currency,
    location,
    timestamp: new Date(),
  };

  // Store transaction history in Redis
  const key = `user:${userId}:transactions`;
  await redisClient.lPush(key, JSON.stringify(transaction));
  await redisClient.lTrim(key, 0, 9); // Keep last 10 transactions

  // Send transaction to Kafka
  await producer.send({
    topic: "transactions",
    messages: [{ key: transaction.userId, value: JSON.stringify(transaction) }],
  });

  console.log("📤 Transaction Sent:", transaction);
  res.status(200).json({ transactionId: transaction.id });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Transaction API running on port ${PORT}`);
  init().catch(console.error);
});
