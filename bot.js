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

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    console.log(`[${channel}] ${tags['display-name']}: ${message}`);

    if (message.toLowerCase() === '!command') {
        console.log(channel, `@${tags['display-name']} has joined`)

        // Type a message in chat -> 'Hello @bremdfam!'
        //client.say(channel, `Hello @${tags['display-name']}!`);
    }
});
