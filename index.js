const fs = require('fs').promises;
const path = require('path');
const express = require("express");
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const app = express();
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function replyToEmail(auth, message) {
    const gmail = google.gmail({ version: 'v1', auth });
    const messageId = message.id;
  
    const response = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
    const headers = response.data.payload.headers;
    const subjectHeader = headers.find(header => header.name.toLowerCase() === 'subject');
    const fromHeader = headers.find(header => header.name.toLowerCase() === 'from');
  
    if (!subjectHeader || !fromHeader) {
      console.log('Invalid email format. Subject or From header is missing.');
      return;
    }
  
    const subject = subjectHeader.value;
    const from = fromHeader.value;
  
    const thread = await gmail.users.threads.get({ userId: 'me', id: message.threadId });
    const messages = thread.data.messages;
    const hasReplies = messages.length > 1;
  
    if (!hasReplies) {
      const messageBody = `Thank you for your email. I am currently on vacation and will respond to your message when I return. Best regards, Your Name`;
      const raw = createReplyRaw(from, subject, messageBody);
  
      // Create the "VACATION" label if it doesn't exist
      const labelRes = await gmail.users.labels.list({ userId: 'me' });
      const labels = labelRes.data.labels;
      let vacationLabel = labels.find(label => label.name === 'VACATION');
      if (!vacationLabel) {
        const labelResponse = await gmail.users.labels.create({ userId: 'me', requestBody: { name: 'VACATION' } });
        vacationLabel = labelResponse.data;
      }
  
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [vacationLabel.id],
          removeLabelIds: ['INBOX'],
        },
      });
    }
  }
  
  
  

function createReplyRaw(to, subject, messageBody) {
  const from = 'ishravan919@gmail.com'; // Replace with your email address
  const headers = {
    To: to,
    Subject: subject,
    From: from,
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Transfer-Encoding': 'quoted-printable',
  };
  const email = [];

  for (const header in headers) {
    email.push(`${header}: ${headers[header]}`);
  }

  email.push('');
  email.push(messageBody);

  return Buffer.from(email.join('\r\n')).toString('base64');
}

async function processEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const response = await gmail.users.messages.list({ userId: 'me', labelIds: ['INBOX'], maxResults: 10 });

  if (response.data.resultSizeEstimate === 0) {
    console.log('No new emails found.');
    return;
  }

  const messages = response.data.messages;
  for (const message of messages) {
    await replyToEmail(auth, message);
  }
}

app.get('/', async (req, res) => {
  try {
    const auth = await authorize();
    res.send(`
      <html>
        <body>
          <h1>Gmail Auto-reply App</h1>
          <button onclick="startProcessing()">Start Processing</button>
          <script>
            function startProcessing() {
              setInterval(function() {
                fetch('/processEmails')
                  .then(function(response) {
                    console.log('Processing triggered.');
                  })
                  .catch(function(error) {
                    console.error('Error:', error);
                  });
              }, Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/processEmails', async (req, res) => {
  try {
    const auth = await authorize();
    console.log("success");
    await processEmails(auth);
    res.send('Email processing completed');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});