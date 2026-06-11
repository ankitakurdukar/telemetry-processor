# Telemetry Processor

Serverless telemetry ingestion service built using AWS Lambda, SQS, DynamoDB and TypeScript.

## Features

- Processes telemetry messages from SQS
- Stores telemetry data in DynamoDB
- Converts timestamps to ISO format
- Sends failed messages to a Dead Letter Queue
- Automated unit tests using Jest

## Architecture

SQS → Lambda → DynamoDB
↓
DLQ
