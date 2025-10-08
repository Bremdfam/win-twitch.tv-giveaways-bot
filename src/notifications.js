import fs from 'fs';
import notifier from 'node-notifier';
import path from 'path';
import { createRequire } from 'module';
import config from './config.js';

const require = createRequire(import.meta.url);
const iconPath = path.resolve('assets/logo.jpg');

let latestTwitchUrl = null;

// Register a single click handler
notifier.on('click', () => {
    if (latestTwitchUrl) {
        require('child_process').exec(`start ${latestTwitchUrl}`);
    }
});

function logMessage(channelName, logText) {
    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logLine = `[${timeStamp}] ${logText}\n`;
    const logPath = path.join('logs', `${channelName}_messages.txt`);

    fs.appendFile(logPath, logLine, (err) => {
        if (err) throw err;
    });
}

function sendNotification(title, message, channelName) {
    latestTwitchUrl = `https://www.twitch.tv/${channelName}`;

    notifier.notify({
        title,
        message: `Message: ${message}`,
        icon: iconPath,
        wait: true,
    });
}

export default function notifications(notif, channelName, message) {
    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    switch (notif) {
        case "offline":
            return new Promise((resolve, reject) => {
                const logText = `${channelName} is offline`;
                logMessage(channelName, logText);

                if (config.notifyWhenStreamGoesOffline === true) {
                    latestTwitchUrl = `https://www.twitch.tv/${channelName}`;
                    notifier.notify({
                        title: `${channelName} is offline`,
                        message: "Disconnecting from stream",
                        icon: iconPath,
                    }, () => resolve());
                } else {
                    resolve();
                }
            });

        case "message":
            logMessage(channelName, `https://www.twitch.tv/${channelName} - Message Repeated: ${message}`);
            sendNotification(`${channelName}: Message repeated`, message, channelName);
            break;

        case "mentioned":
            logMessage(channelName, `USERNAME MENTIONED AT https://www.twitch.tv/${channelName} - ${message}`);
            sendNotification(`${channelName}: USERNAME MENTIONED`, message, channelName);
            break;

        default:
            return Promise.resolve();
    }
}
