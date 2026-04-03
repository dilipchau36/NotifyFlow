import { Kafka, logLevel } from "kafkajs"

const globalForKafka = globalThis as unknown as {
  kafka: Kafka | undefined;
}

export const kafka = globalForKafka.kafka ?? new Kafka({
  clientId: "notifyflow",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  logLevel: logLevel.WARN,
})

if (process.env.NODE_ENV !== "production") globalForKafka.kafka = kafka

