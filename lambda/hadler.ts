import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const ses = new AWS.SES();
const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME!;
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT!;

export const main: APIGatewayProxyHandler = async (event) => {
    const timestamp = Date.now();
    let body: any;

    try {
        body = JSON.parse(event.body || '{}');
        console.log('Incoming JSON:', JSON.stringify(body));
    } catch (err) {
        console.error('Malformed JSON:', err);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON format' }),
        };
    }

    if (isValidJson(body)) {
        try {
            await ses.sendEmail({
                Source: EMAIL_RECIPIENT,
                Destination: { ToAddresses: [EMAIL_RECIPIENT] },
                Message: {
                    Subject: { Data: 'Valid JSON Received' },
                    Body: {
                        Text: { Data: JSON.stringify(body, null, 2) },
                    },
                },
            }).promise();

            console.log('Valid JSON email sent.');
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Email sent for valid JSON' }),
            };
        } catch (err) {
            console.error('Error sending email:', err);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Failed to send email' }),
            };
        }
    }

    // Store invalid JSON
    const ttl = Math.floor((timestamp + 30 * 60 * 1000) / 1000); // 30 minutes TimeToLive
    const item = {
        PK: 'InvalidJSON',
        SK: timestamp.toString(),
        Body: body,
        CreatedAt: timestamp,
        ExpireAt: ttl,
    };

    try {
        await ddb.put({ TableName: TABLE_NAME, Item: item }).promise();
        console.warn('Invalid JSON stored in DynamoDB:', item);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON stored' }),
        };
    } catch (err) {
        console.error('Failed to write to DynamoDB:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to store invalid JSON' }),
        };
    }
};

//  JSON structure check
function isValidJson(obj: any): boolean {
    return (
        typeof obj === 'object' &&
        obj.valid === true &&
        typeof obj.value === 'number' &&
        typeof obj.description === 'string' &&
        typeof obj.buyer === 'string' &&
        obj.value > 0 &&
        obj.description.trim().length > 0 &&
        obj.buyer.trim().length > 0
    );
}