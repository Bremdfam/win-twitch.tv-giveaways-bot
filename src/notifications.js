import fs from 'fs'; // Write to txt files
import notifier from 'node-notifier'; // Makes notifications
import path from 'path'; // Resolves paths
import { createRequire } from 'module';
import config from './config.js';

const require = createRequire(import.meta.url);
const iconPath = path.resolve('assets/logo.jpg')

export default function notifications(notif, channelName, message) {
    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    switch (notif) {
        case "offline":
            fs.appendFile(`logs/${channelName}_messages.txt`, `[${timeStamp}]  ${channelName} is offline\n`, (err) => {
                if (err) throw err;
            });
            if (config.notifyWhenStreamGoesOffline == true) {
                notifier.notify({
                    title: `${channelName} is offline`,
                    message: "Disconnecting from stream",
                    icon: iconPath,
                })
            }
            break;
        case "message":
            fs.appendFile(`logs/${channelName}_messages.txt`, `[${timeStamp}] https://www.twitch.tv/${channelName} - Message Repeated: ${message}\n`, (err) => {
                if (err) throw err;
            });

            notifier.notify(
                {
                    title: `${channelName}: Message repeated`,
                    message: `Message: ${message}`,
                    icon: iconPath,
                    wait: true,
                }
            )

            notifier.once('click', () => {
                require('child_process').exec(`start https://www.twitch.tv/${channelName}`)
            })
            break;
        case "mentioned":
            fs.appendFile(`logs/${channelName}_messages.txt`, `[${timeStamp}] USERNAME MENTIONED AT https://www.twitch.tv/${channelName} - ` + message + `\n`, (err) => {
                if (err) throw err;
            });

            notifier.notify(
                {
                    title: `${channelName}: USERNAME MENTIONED`,
                    message: `Message: ${message}`,
                    icon: iconPath,
                    wait: true,
                }
            )

            notifier.once('click', () => {
                require('child_process').exec(`start https://www.twitch.tv/${channelName}`)
            })
            break;
    }
}