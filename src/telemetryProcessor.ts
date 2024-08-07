import { SQSEvent, SQSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMO_DB_TABLE;
const sqs = new AWS.SQS();
const dlqUrl = process.env.DLQ_URL;

if (!tableName) throw new Error("DYNAMO_DB_TABLE is a required env variable");
if (!dlqUrl) throw new Error("DLQ_URL is a required env variable");

export const handler: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const telemetryData = JSON.parse(record.body);

    const params = {
      TableName: tableName,
      Item: {
        ...telemetryData,
        creationTimeISO: new Date(telemetryData.creationTime).toISOString(),
      },
    };

    try {
      await dynamoDB.put(params).promise();
    } catch (error) {
      console.error("Error storing telemetry data:", error);

      // Send the failed message to the Dead Letter Queue (DLQ)
      const dlqParams = { QueueUrl: dlqUrl, MessageBody: record.body };

      try {
        await sqs.sendMessage(dlqParams).promise();
      } catch (dlqError) {
        console.error("Error sending message to DLQ:", dlqError);
      }
    }
  }
};
