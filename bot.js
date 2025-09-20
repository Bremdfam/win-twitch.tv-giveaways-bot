require('dotenv').config();
const tmi = require('tmi.js');

const channels = process.env.CHANNELS.split(',');

const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN
    },
    channels: channels
});

client.connect();

const message_list = [] // Array of messages from ALL chats
let lastBotMessageTime = 0; // Timestamp of last bot message
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

client.on('message', (channel, tags, message, self) => {
    if (self || tags['user-type'] === 'bot' || tags.mod) return;

    message_list.push(message)
    const last_message = message_list[message_list.length - 1]

    console.log(message_list, "LIST OF MESSAGES")
    console.log(last_message)

    if (message_list.length > 10) { message_list.shift(); } // Remove oldest message


    if (message_list.length >= 5) {
        const lastFive = message_list.slice(-6, -1); // Get the 5 messages before the last one
        const allSame = lastFive.every(msg => msg === last_message); // Check if the last message is the same as the previous five
        const now = Date.now();
        const onCooldown = now - lastBotMessageTime < COOLDOWN_MS;

        if (allSame && !onCooldown) {
            console.log("The last is same as the last five:", last_message)
            lastBotMessageTime = now; // Update cooldown timestamp
            // Print the last message to chat
            client.say(channel, last_message);

        } else if (onCooldown) {
            console.log("On Cool down")
        } else {
            console.log("Msg is not the same")
        }
    }



});
