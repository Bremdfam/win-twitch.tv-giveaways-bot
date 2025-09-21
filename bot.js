require('dotenv').config();
const fs = require('fs'); // writes to text file
const tmi = require('tmi.js');
const player = require('play-sound')({ players: ['powershell'] });
const path = require('path');
const soundPath = path.resolve(__dirname, 'button-10.wav');

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
let same_message_count = 0

client.on('message', (channel, tags, message, self) => {
    if (self || tags['user-type'] === 'bot' || tags.mod || tags.badges?.vip) return; // Filters out bots, mods, and my own messages

    message_list.push(message)
    const last_message = message_list[message_list.length - 1]

    console.log(message_list)
    console.log(last_message)
    console.log(same_message_count)

    if (message_list.length > 10) { message_list.shift(); } // Remove oldest message


    if (message_list.length >= 3) {
        const lastFive = message_list.slice(-3); // Get the 5 last messages
        const allSame = lastFive.every(msg => msg === last_message); // Check if the last message is the same as the previous five
        const now = Date.now();
        const onCooldown = now - lastBotMessageTime < COOLDOWN_MS; // 30 minute cooldown


        if (allSame) { //&& !onCooldown
            const logEntry = `[${new Date(now).toISOString()}] [${channel}] ${message}\n`;
            same_message_count = same_message_count + 1

            fs.appendFile('message.txt', logEntry, (err) => {
                if (err) throw err;
                console.log('Message saved to message.txt');
            }); // writes to message file

            player.play(soundPath, (err) => {
                if (err) console.error('Error playing sound:', err);
            }); // play sound

            lastBotMessageTime = now; // Update cooldown timestamp
            //client.say(channel, last_message); // Print the last message to chat

        } else if (onCooldown) {
            console.log("On Cool down")
        } else {
            console.log("Msg is not the same")
        }
    }



});
