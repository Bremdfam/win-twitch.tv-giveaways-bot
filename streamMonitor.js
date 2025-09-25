import 'dotenv/config'; // Load env variables
import fs from 'fs'; // Write to txt files
import playSound from 'play-sound'; // Sound player
import path from 'path'; // Resolves paths
import fetch from 'node-fetch'; // Makes HTTP requests
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const player = playSound({ players: ['powershell'] }); // Configure sound player
const soundPathDisconnect = path.join(__dirname, 'sounds/phone-disconnect-1.wav');

// List of channels to track from the .env file
const channels = process.env.CHANNELS.split(',');
const disconnectedChannels = new Set();

export default function streamMonitor(client) {
    // Check if streamer is live
    async function isStreamerLive(username) {
        try {
            const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${username.replace("#", "")}`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN.replace("oauth:", "")}`
                }
            });

            if (!response.ok) {
                throw new Error(`Twitch API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data?.data?.length > 0;
        } catch (error) {
            console.error(`Error checking ${username} status:`, error.message);
            return false;
        }
    }

    // Check stream every minute to see if they're live. If not, log it and disconnect bot from chat
    setInterval(async () => {
        for (const username of channels.map(c => c.replace('#', ''))) {
            const live = await isStreamerLive(username);
            if (live) {
                console.log(`${username} is LIVE!`);
            } else if (!disconnectedChannels.has(username)) {
                disconnectedChannels.add(username);

                fs.appendFile(`messages/${username}_messages.txt`, `${username} is offline\n`, (err) => {
                    if (err) throw err;
                });

                try {
                    await client.part(`#${username}`);
                    console.log(`Disconnected from ${username}`);
                } catch (err) {
                    console.error(`Error disconnecting from ${username}:`, err.message);
                }

                player.play(soundPathDisconnect, (err) => {
                    if (err) console.error('Error playing disconnect sound:', err);
                });
            }

        }
    }, 60000);
}

