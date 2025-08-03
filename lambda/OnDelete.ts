import { DynamoDBStreamHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const ses = new AWS.SES();
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT!;

export const main: DynamoDBStreamHandler = async (event) => {
    for (const record of event.Records) {
        if (record.eventName !== 'REMOVE') continue;

        const oldImage = record.dynamodb?.OldImage;
        if (!oldImage) continue;

        const createdAt = parseInt(oldImage.CreatedAt?.N || '0');
        const bodyRaw = oldImage.Body?.S || JSON.stringify(oldImage.Body?.M);
        const now = Date.now();
        const timeAliveSeconds = Math.floor((now - createdAt) / 1000);

        const emailBody = [
            ' Invalid JSON auto-deleted after TTL.',
            `Lived for: ${timeAliveSeconds} seconds`,
            '',
            ' Original Payload:',
            bodyRaw,
        ].join('\n');

        try {
            await ses.sendEmail({
                Source: EMAIL_RECIPIENT,
                Destination: { ToAddresses: [EMAIL_RECIPIENT] },
                Message: {
                    Subject: { Data: ' Invalid JSON Deleted After TTL' },
                    Body: { Text: { Data: emailBody } },
                },
            }).promise();

            console.log(`Deletion email sent. Lived for ${timeAliveSeconds} seconds.`);
        } catch (err) {
            console.error('Failed to send deletion email:', err);
        }
    }
};