require('dotenv').config();
const fs = require('fs'); // writes to text file
const tmi = require('tmi.js');
const player = require('play-sound')({ players: ['powershell'] });
const path = require('path');
const soundPath = path.resolve(__dirname, 'button-10.wav');
const soundPathDisconnect = path.resolve(__dirname, 'phone-disconnect-1.wav');

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
    if (self || tags['user-type'] === 'bot' || tags.mod || tags.badges?.vip) return; // Filters out bots, mods, vips, and my own messages

    message_list.push(message)
    const last_message = message_list[message_list.length - 1]

    console.log(message_list)
    console.log(last_message)

    if (message_list.length > 10) { message_list.shift(); } // Remove oldest message


    if (message_list.length >= 5) {
        const lastFive = message_list.slice(-3); // Get the 5 last messages
        const allSame = lastFive.every(msg => msg === last_message); // Check if the last message is the same as the previous five
        const now = Date.now();
        const onCooldown = now - lastBotMessageTime < COOLDOWN_MS; // 30 minute cooldown


        if (allSame) { //&& !onCooldown
            const logEntry = `[${new Date(now).toLocaleString()}] [${channel}] ${message}\n`;

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
            console.log("Last 5 msgs are not the same")
        }
    }

});

// Check if streamer is live
const fetch = require('node-fetch');

async function isStreamerLive(username) {
    try {
        const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${username}`, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN.replace("oauth:", "")}`
            }
        });

        const data = await response.json();

        if (!data || !data.data) {
            console.error('Unexpected API response:', data);
            return false;
        }

        return data.data.length > 0; // true if live, false if offline
    } catch (error) {
        console.error('Error checking stream status:', error);
        return false;
    }
}

// Monitor stream status
setInterval(async () => {
    const username = process.env.CHANNELS;
    const live = await isStreamerLive(username);

    if (live) {
        console.log(`${username} is LIVE!`);
    } else {
        console.log(`${username} is offline.`);
        client.disconnect(); // disconnect client from streamer
        player.play(soundPathDisconnect, (err) => {
            if (err) console.error('Error playing sound:', err);
        }); // play sound
        process.exit(0); // end program
    }
}, 10000); // Check every 10 seconds