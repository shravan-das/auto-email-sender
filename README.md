# Gmail Auto-reply App

This is a Node.js application that automates replying to emails in Gmail using the Gmail API. The application is built using Express.js framework and Google Cloud libraries.

## Walkthrough of the Application
https://github.com/shravan-das/auto-email-sender/assets/100745475/d84dec3c-8b89-47c0-b14b-0cb2923d7ab7

## Prerequisites

Before running the application, make sure you have the following prerequisites:

- Node.js installed on your machine
- Gmail API enabled in the Google Cloud Console
- OAuth 2.0 client credentials (credentials.json) for accessing the Gmail API
- Existing token.json file containing the user's authorization credentials (if available)

## Installation

1. Clone this repository to your local machine:

   ```shell
   git clone https://github.com/shravan-das/auto-email-sender.git
   ```

2. Navigate to the project directory:

   ```shell
   cd suto-email-sender
   ```

3. Install the required dependencies:

   ```shell
   npm install
   ```

## Configuration

1. Obtain the OAuth 2.0 client credentials by creating a new project in the Google Cloud Console and enabling the Gmail API. Download the client credentials file (credentials.json) and place it in the project directory.

2. (Optional) If you already have authorization credentials (token.json), place the file in the project directory. This will allow the application to skip the authentication process and use the saved credentials.

## Usage

1. Start the application:

   ```shell
   npm start
   ```

2. Access the application in your web browser at http://localhost:3000.

3. Click the "Start Processing" button to initiate the email processing. The application will fetch emails from the "INBOX" label and automatically reply to each email that does not have any previous replies.

4. The processing interval is randomized between 45 and 120 seconds for each fetch. You can adjust this interval by modifying the JavaScript code in the HTML template provided in the application's root route.

