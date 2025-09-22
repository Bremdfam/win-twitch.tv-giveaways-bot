require('dotenv').config();
const fs = require('fs');
const tmi = require('tmi.js');
const player = require('play-sound')({ players: ['powershell'] });
const path = require('path');
const fetch = require('node-fetch');

const soundPath = path.resolve(__dirname, 'sounds/button-10.wav');
const soundPathDisconnect = path.resolve(__dirname, 'sounds/phone-disconnect-1.wav');
const soundPathNameMentioned = path.resolve(__dirname, 'sounds/machine-gun-02.wav');

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

const messageMap = {}; // { channel: [messages] }
const lastBotMessageTimeMap = {}; // { channel: timestamp }
const COOLDOWN_MS = 30 * 60 * 1000;

client.on('message', (channel, tags, message, self) => {
    if (self || tags['user-type'] === 'bot' || tags.mod || tags.badges?.vip) return;

    if (!messageMap[channel]) messageMap[channel] = [];
    const messages = messageMap[channel];

    messages.push(message);
    if (messages.length > 10) messages.shift();

    // ✅ Log the current message array for this channel
    console.log(`Messages for ${channel}:`, messages);

    const lastMessage = messages[messages.length - 1];
    const lastThree = messages.slice(-3);
    const allSame = lastThree.every(msg => msg === lastMessage);

    const now = Date.now();
    const lastTime = lastBotMessageTimeMap[channel] || 0;
    const onCooldown = now - lastTime < COOLDOWN_MS;

    // ✅ Detect if your username is mentioned
    const usernameMentioned = message.toLowerCase().includes(process.env.TWITCH_USERNAME.toLowerCase());
    if (usernameMentioned) {
        console.log(`[${channel}] Your username was mentioned: "${message}"`);
        player.play(soundPathNameMentioned, (err) => {
            if (err) console.error('Error playing sound:', err);
        });
    }

    if (messages.length >= 3 && allSame && !onCooldown) {
        const logEntry = `[${new Date(now).toLocaleString()}] [${channel}] ${message}\n`;

        fs.appendFile(`messages/${channel.replace('#', '')}_messages.txt`, logEntry, (err) => {
            if (err) throw err;
        });

        player.play(soundPath, (err) => {
            if (err) console.error('Error playing sound:', err);
        });

        lastBotMessageTimeMap[channel] = now;
    } else if (onCooldown) {
        console.log(`[${channel}] On cooldown`);
    } else {
        console.log(`[${channel}] Messages not repeated`);
    }
});

// Check if streamer is live
async function isStreamerLive(username) {
    try {
        const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${username}`, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN.replace("oauth:", "")}`
            }
        });

        const data = await response.json();
        return data?.data?.length > 0;
    } catch (error) {
        console.error(`Error checking ${username} status:`, error);
        return false;
    }
}

// Monitor each stream
setInterval(async () => {
    for (const username of channels.map(c => c.replace('#', ''))) {
        const live = await isStreamerLive(username);
        if (live) {
            console.log(`${username} is LIVE!`);
        } else {
            fs.appendFile(`messages/${username}_messages.txt`, `${username} is offline`, (err) => {
                if (err) throw err;
            });
            client.part(`#${username}`);
            player.play(soundPathDisconnect, (err) => {
                if (err) console.error('Error playing disconnect sound:', err);
            });
        }
    }
}, 30000);
