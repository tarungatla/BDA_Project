const { Kafka } = require("kafkajs");

// Initialize Kafka client
const kafka = new Kafka({
  clientId: "fraud-alert-consumer",
  brokers: ["localhost:9094"],
});

// Create Kafka consumer
const consumer = kafka.consumer({ groupId: "fraud-alert-group" });

async function consumeFraudAlerts() {
  try {
    // Connect the consumer
    await consumer.connect();

    // Subscribe to the fraud-alerts topic
    await consumer.subscribe({ topic: "fraud-alerts", fromBeginning: true });

    console.log("🚨 Fraud Alert Consumer is running...");

    // Consume messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const alert = JSON.parse(message.value.toString());

        console.log("\n-----------------------------");
        console.log("📢 Fraud Alert Received:");
        console.log(alert);

        // TODO: Integrate with email/SMS notification system if needed
        // Example: sendEmail(alert) or sendSMS(alert)
      },
    });
  } catch (error) {
    console.error("❌ Error in fraud alert consumer:", error);
    process.exit(1);
  }
}

// Start consuming
consumeFraudAlerts();
