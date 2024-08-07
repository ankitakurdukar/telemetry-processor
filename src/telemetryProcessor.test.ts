import { handler } from "./telemetryProcessor";
import * as AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";
import { SQSEvent } from "aws-lambda";

AWSMock.setSDKInstance(AWS);

describe("Telemetry Processor", () => {
  beforeAll(() => {
    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, {});
    });

    AWSMock.mock("SQS", "sendMessage", (params, callback) => {
      callback(undefined, {});
    });
  });

  afterAll(() => {
    // Restore all mocked AWS services
    AWSMock.restore();
  });

  it("should store telemetry data successfully", async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "string",
          body: JSON.stringify({
            version: "1.0",
            creationTime: 1723046351000,
            siteId: "site123",
            deviceId: "device123",
            temperature: {
              celsius: 25,
              fahrenheit: 77,
            },
          }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "string",
          eventSource: "aws:sqs",
          eventSourceARN: "string",
          awsRegion: "string",
        },
      ],
    };

    await handler(event);

    // Expect DynamoDB put to be called
    expect(AWS.DynamoDB.DocumentClient.prototype.put).toHaveBeenCalled();
  });

  it("should send message to DLQ on failure", async () => {
    AWSMock.remock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(new Error("DynamoDB error"), null);
    });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "string",
          body: JSON.stringify({
            version: "1.0",
            creationTime: 1723046351000,
            siteId: "site123",
            deviceId: "device123",
            temperature: {
              celsius: 25,
              fahrenheit: 77,
            },
          }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "string",
          eventSource: "aws:sqs",
          eventSourceARN: "string",
          awsRegion: "string",
        },
      ],
    };

    await handler(event);

    // Expect SQS sendMessage to be called
    expect(AWS.SQS.prototype.sendMessage).toHaveBeenCalled();
  });
});
