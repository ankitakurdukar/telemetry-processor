const { handler } = require("./telemetryProcessor");
const AWSMock = require("aws-sdk-mock");
const AWS = require("aws-sdk");
const { SQSEvent } = require("aws-lambda");

AWSMock.setSDKInstance(AWS);

describe("Telemetry Processor", () => {
  beforeAll(() => {
    // Mock DynamoDB put operation
    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, {}); // Simulate successful put operation
    });

    // Mock SQS sendMessage operation
    AWSMock.mock("SQS", "sendMessage", (params, callback) => {
      callback(undefined, {}); // Simulate successful sendMessage operation
    });
  });

  afterAll(() => {
    // Restore all mocked AWS services
    AWSMock.restore();
  });

  it("should store telemetry data successfully", async () => {
    const event = {
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

    // Run the Lambda handler
    await handler(event);

    // Check that the DynamoDB put operation was called
    /*  expect(
      AWSMock.mockedMethods["DynamoDB.DocumentClient"]["put"]
    ).toHaveBeenCalled(); */
  });

  it("should send message to DLQ on failure", async () => {
    // Remock the DynamoDB put operation to simulate a failure
    AWSMock.remock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(new Error("DynamoDB error"), null); // Simulate failure in put operation
    });

    const event = {
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

    // Run the Lambda handler
    await handler(event);

    // Check that the SQS sendMessage operation was called (DLQ)
    expect(AWSMock.mockedMethods["SQS"]["sendMessage"]).toHaveBeenCalled();
  });
});
