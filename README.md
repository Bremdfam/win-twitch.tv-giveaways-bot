# Twitch.tv-Giveaway-Bot
A chatbot for Twitch.tv that automates winning giveaways

- [x] Read Chat messages
- [x] Know when at least 5 msgs are the same in a row
- [x] Type that msg in chat
- [x] stop typing in chat for that channel for 10 minutes unless my name has been said
- [x] read chat for my username
- [x] print a msg when any msg that contains my name has been said after a minute of my msg being printed (otherwise a bot might @ me to say I've entered rather than won)
- [x] ping the user to let them know they have won/entered the giveaway
- [x] disconnect when a streamer is offline
- [] Have a list of different things to say when you win
    - mention steam incase the streamer needs to know what platform you're on
- Get rid of noise notif? - need custom APPID or tell user to change their own settings
- [] Change the cooldown so if a repeat message is detected log it and if the next message is the same within like 10 minutes then don't say it a second time. If it is not the same then say the message.
- [] Add streamer-specific checks the user can modify
    - If a streamer does not require you to re enter giveaway
    - If re-entering makes you leave the giveaway
    - Different splice options to detect duplicate words in smaller chats
    - specific words to filter out (like !join for dbd queues)
- [x] create a filters array to filter out specific words (like "raid" and streamer emotes)
- [] Refine README
- [] See if you can automatically search twitch titles and categories for !giveaway
