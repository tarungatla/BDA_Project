const { Kafka, Partitioners } = require("kafkajs");
const redis = require("redis");

const kafka = new Kafka({
  clientId: "fraud-detection-consumer",
  brokers: ["localhost:9094"],
});

const consumer = kafka.consumer({ groupId: "fraud-detection-group" });
const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

const redisClient = redis.createClient({
  url: "redis://:canremember@localhost:6379",
});

async function consumeTransactions() {
  await consumer.connect();
  await consumer.subscribe({ topic: "transactions", fromBeginning: false });
  await producer.connect();
  await redisClient.connect();

  await consumer.run({
    eachMessage: async ({ message }) => {
      const transaction = JSON.parse(message.value.toString());
      const { userId, amount, location, timestamp } = transaction;

      console.log("Processing transaction:", transaction);

      // Fraud Rule 1: Large Transaction Amount
      if (amount > 10000) {
        await sendFraudAlert(userId, "Large Transaction Detected", transaction);
      }

      // Fraud Rule 2: Multiple Transactions in Short Time
      const timestampsKey = `user:${userId}:transactionTimestamps`;
      await redisClient.lPush(timestampsKey, timestamp);
      await redisClient.lTrim(timestampsKey, 0, 4); // Keep last 5 transactions

      const lastTimestamps = await redisClient.lRange(timestampsKey, 0, -1);

      if (lastTimestamps.length >= 5) {
        const firstTransactionTime = new Date(
          lastTimestamps[lastTimestamps.length - 1]
        ).getTime();
        const lastTransactionTime = new Date(lastTimestamps[0]).getTime();
        const differenceInTimestamps =
          lastTransactionTime - firstTransactionTime;

        console.log("Difference:", differenceInTimestamps);

        if (differenceInTimestamps <= 30000) {
          await sendFraudAlert(
            userId,
            "Multiple Rapid Transactions Detected",
            transaction
          );
        }
      }

      // Fraud Rule 3: Location Change
      const locationKey = `user:${userId}:location`;
      const lastLocation = await redisClient.get(locationKey);

      if (lastLocation && lastLocation !== location) {
        await sendFraudAlert(
          userId,
          "Unusual Location Change Detected",
          transaction
        );
      }

      // Update last known location
      await redisClient.set(locationKey, location);
    },
  });
}

async function sendFraudAlert(userId, reason, transaction) {
  const alert = {
    userId,
    reason,
    transaction,
    timestamp: new Date().toISOString(),
  };

  await producer.send({
    topic: "fraud-alerts",
    messages: [{ value: JSON.stringify(alert) }],
  });

  console.log("Fraud Alert Sent:", alert);
}

consumeTransactions().catch(console.error);
