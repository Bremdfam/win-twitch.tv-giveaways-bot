import fs from 'fs'; // Write to txt files
import notifier from 'node-notifier'; // Makes notifications
import path from 'path'; // Resolves paths
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconPath = path.join(__dirname, 'logo.jpg')

export default function notifications(notif, channelName, message) {
    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    switch (notif) {
        case "offline":
            fs.appendFile(`messages/${channelName}_messages.txt`, `[${timeStamp}]  ${channelName} is offline\n`, (err) => {
                if (err) throw err;
            });

            notifier.notify({
                title: `${channelName} is offline`,
                message: "Disconnecting from stream",
                icon: iconPath,
            })
            break;
        case "message":
            fs.appendFile(`messages/${channelName}_messages.txt`, `[${timeStamp}] https://www.twitch.tv/${channelName} - Message Repeated: ${message}\n`, (err) => {
                if (err) throw err;
            });

            notifier.notify(
                {
                    title: `Message repeated`,
                    message: `Channel: ${channelName}\nMessage: ${message} has been repeated.`,
                    icon: iconPath,
                    wait: true,
                }
            )

            notifier.once('click', () => {
                require('child_process').exec(`start https://www.twitch.tv/${channelName}`)
            })
            break;
        case "mentioned":
            fs.appendFile(`messages/${channelName}_messages.txt`, `[${timeStamp}] USERNAME MENTIONED AT https://www.twitch.tv/${channelName} - ` + message + `\n`, (err) => {
                if (err) throw err;
            });

            notifier.notify(
                {
                    title: `USERNAME DETECTED`,
                    message: `Channel: ${channelName}\nMessage: ${message}`,
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