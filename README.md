# Win Twitch.tv Giveaways Bot
A configurable chatbot for Twitch.tv that automates winning giveaways by detecting repeated messages, username mentions, and stream status changes.

## Features

- **Giveaway Detection**: Joins giveaways when multiple different users repeat the same message (e.g., "!join").
- **Username Mention Alerts**: Detects when your Twitch username is mentioned and responds with a win message.
- **Stream Status Monitoring**: Automatically disconnects from offline channels and exits when all streams go offline.
- **Desktop Notifications**: Alerts you when giveaways are detected, your username is mentioned, or a stream goes offline.
- **Per-Channel Configs**: Customize filters, spam thresholds, and behavior for each monitored channel.
- **Logging**: Saves timestamped logs of detected events per channel.
- **Toggleable Features**: Enable or disable auto-entry, win messages, and offline notifications via config.

## How to Install

1. Install Node.Js
    - You can install NodeJs from their website [here](https://nodejs.org/en/download).

2. Clone the repository

   ```bash
   git clone https://github.com/bremdfam/win-twitch.tv-giveaways-bot.git
   cd win-twitch.tv-giveaways-bot
   ```

3. Install Dependencies

    ```bash
    npm install
    ```

## How to Configure
### Open src/config.js
```js
// Twitch credentials
const TWITCH_USERNAME = "YOUR USERNAME"
const TWITCH_OAUTH_TOKEN = "YOUR TOKEN"
const TWITCH_CLIENT_ID = "YOUR ID"

// Channels to monitor and channel specific configs
const channels = [
    {
        channelName: "",
        filters: [],
        duplicateMessagesInARow: 0,
    },
    // {
    //     channelName: "",
    //     filters: [],
    //     duplicateMessagesInARow: 0,
    // }
]

const globalFilters = ["raid"] // Filters for all channels
const automaticallyJoinGiveaway = true; // Auto joins giveaway
const automaticallySendWinMessage = true; // Auto sends win message
const joinGiveawayCooldown = 15; // Amount of time in MINUTES before you can enter the same stream's giveaway
const usernameDetectionCooldown = 30; // Amount of time in SECONDS your username will not be detected after entering a giveaway
const winMessages = ['YOOOOO', "Yippee :)", "PogChamp PogChamp PogChamp"]; // Messages to say when you win
const notifyWhenStreamGoesOffline = true; // Notifies you when a stream goes offline
```
### How to Get Your Twitch Credentials
1. To generate your Twitch credentials, use the **[Twitch Token Generator](https://twitchtokengenerator.com/)** by swiftyspiffy.

2. Scroll down to the **Available Token Scopes** section.

3. Switch `chat:read` and `chat:edit` to Yes—these permissions are required for the bot to read and send messages in chat.

4. Click **Generate Token**.

5. **Authorize your Twitch account** when prompted.

6. Copy the generated Access Token and Client ID into your config.js

7. Your Twitch username is the username you use on Twitch.


```js
// Twitch credentials
const TWITCH_USERNAME = "bremdfam"
const TWITCH_OAUTH_TOKEN = "w4df5g1abgn1o2erg4ghfihp9n0owv"
const TWITCH_CLIENT_ID = "1o8d1qx2y9vcvtthnou9x6qpn0m8b5"
```
#### Note:
1. Sometimes your Twitch Access Token will include the prefix `oauth:`. Make sure to copy the **entire token**, including the prefix, into your `TWITCH_OAUTH_TOKEN` field: `TWITCH_OAUTH_TOKEN = "oauth:w4df5g1abgn1o2erg4ghfihp9n0owv"`
2. **You should not share these tokens publicly!** The ones shown are examples meant to represent what the tokens may look like. If you're saving your project to GitHub or working in a shared environment, use a `.env` file to keep your credentials secure. You can copy the structure from `.env.example` and insert your actual tokens there. Use .gitignore to stop Github from uploading your tokens.

### Per-Channel Configs
- `channelName:`
    - The name of the stream you want to track.
    - You can find a streamer's name at the end of the Twitch URL e.g. https://www.twitch.tv/kaicenat.
- `filters:`
    - Add specific words or phrases you do not want the bot to say.
    - Leave empty to not have a specific filter.
    - Mainly used to filter out non-giveaway related spam. For example, some streamers like to play games with their chatters. To join they have them type something like "!play". If you do not filter out !play the bot will say it in chat and you will join the streamer's queue.
- `duplicateMessagesInARow:`
    - Determines how many duplicate messages need to be said in a row before the bot repeats it.
    - For larger streams of 100+ I would recommend at least 10. For smaller streams you can change it to ~5.
```js
// Channels to monitor and channel specific configs
const channels = [
    {
        channelName: "kaicenat",
        filters: ["FILTEREDWORD", "FILTERED PHRASE", "!play"],
        duplicateMessagesInARow: 10,
    },
    {
        channelName: "ishowspeed",
        filters: [],
        duplicateMessagesInARow: 15,
    }
]
```
#### Note:
Do not leave `channelName` or `duplicateMessagesInARow` blank or at 0. If you only want to track one channel then you should only have one object in the array.

### Global Configs
- `globalFilters`
    - Is a global filter for all channels.
    - Has "raid" by default to prevent the bot from repeating raid messages.
```js
const globalFilters = ["raid"] // Filters for all channels
```

- `automaticallyJoinGiveaway`
    - Automatically sends the duplicate message in chat.
    - If set to false the bot will not send a message in chat. You will still be notified if a duplicate message is repeated.
```js
const automaticallyJoinGiveaway = true; // Auto joins giveaway
```

- `automaticallySendWinMessage`
    - Automatically sends a win message when your username is detected.
    - If set to false the bot will not send a message in chat. You will still be notified if your username is repeated.
```js
const automaticallySendWinMessage = true; // Auto sends win message
```

- `joinGiveawayCooldown`
    - The amount of time in **minutes** before the bot can send another duplicate message in the same chat.
    - Prevents spamming duplicate messages in the chat within this time frame.
```js
const joinGiveawayCooldown = 15; // Amount of time in MINUTES before you can enter the same stream's giveaway
```

- `usernameDetectionCooldown`
    - The amount of time in **seconds** your username will not be detected after entering a giveaway or when your username is mentioned.
    - Prevents the bot from spamming win messages when your username is mentioned.
```js
const usernameDetectionCooldown = 30; // Amount of time in SECONDS your username will not be detected after entering a giveaway
```

- `winMessages`
    - A list of randomly selected words or phrases the bot can say when your username is mentioned.
```js
const winMessages = ["YOOOOO", "Yippee :)", "PogChamp PogChamp PogChamp"]; // Messages to say when you win
```

- `notifyWhenStreamGoesOffline`
    - Notifies you when a streamer goes offline.
```js
const notifyWhenStreamGoesOffline = true; // Notifies you when a stream goes offline
```
---
### Run the Bot
Save the modified config file and your .env(if you created one).
Type the following code while in your win-twitch.tv-giveaways-bot directory:
```bash
node src/bot.js
```
---
### Bot Behavioral Warnings
1. Any time your username is mentioned when not on cooldown a message will be sent if automaticallySendWinMessage is true. Be sure to toggle that off if you plan to talk in chat so people can @ you without triggering the bot message.

2. I do not know Twitch TOS but I imagine this breaks a rule somewhere and could get you banned `¯\_(ツ)_/¯`. Use at your own risk.

3. If a chat is on follower/subs only mode and you are not one of those then the bot will not be able to send a message.

