const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
▓▒░ *TITAN* ░▒▓
by ${settings.botOwner} | v${settings.version}

──────⊰ *COMMANDS* ⊱──────

━━━ 𝗕𝗔𝗦𝗜𝗖 ━━━
🔹 .help | .menu - Show this menu
🔹 .ping - Check bot response
🔹 .alive - Check if bot is active
🔹 .owner - Get owner contact

━━━ 𝗠𝗘𝗗𝗜𝗔 ━━━
🔹 .sticker - Convert to sticker
🔹 .crop - Create cropped sticker
🔹 .emojimix - Mix two emojis
🔹 .tgsticker - Telegram stickers
🔹 .take - Change sticker metadata
🔹 .igs - Instagram to sticker
🔹 .removebg - Remove background
🔹 .remini - Enhance image quality

━━━ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 ━━━
🔹 .play | .song - Download music
🔹 .spotify - Spotify audio
🔹 .tiktok - TikTok video/audio
🔹 .instagram - Instagram media
🔹 .facebook - Facebook videos
🔹 .ytmp4 - YouTube video

━━━ 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡 ━━━
🔹 .ban | .unban - Control users
🔹 .kick - Remove member
🔹 .promote | .demote - Manage admins
🔹 .mute | .unmute - Control chat
🔹 .warn - Issue warning
🔹 .tag | .tagall - Mention members
🔹 .hidetag - Hidden mention
🔹 .setgpp - Set group picture
🔹 .setgname - Change group name
🔹 .setgdesc - Edit description
🔹 .resetlink - Reset invite link

━━━ 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗜𝗢𝗡 ━━━
🔹 .antilink - Block links
🔹 .antibadword - Filter language
🔹 .antitag - Prevent mass tagging
🔹 .welcome - Greeting messages
🔹 .goodbye - Farewell messages
🔹 .delete | .del - Remove messages
🔹 .clear - Clear chat

━━━ 𝗙𝗨𝗡 ━━━
🔹 .dare | .truth - Party games
🔹 .tts - Text to speech
🔹 .flirt - Flirty messages
🔹 .joke - Random jokes
🔹 .fact - Random facts
🔹 .ship - Ship two members
🔹 .simp - Simp card
🔹 .meme - Random memes
🔹 .attp - Animated text
🔹 .ss - Website screenshot
━━━ 𝗢𝗪𝗡𝗘𝗥 ━━━
🔹 .setpp - Change bot picture
🔹 .cleartmp - Clear temporary files
🔹 .mode - Public/private mode
🔹 .sudo - Manage bot admins
🔹 .autotyping - Auto typing effect
🔹 .autoread - Auto read messages
🔹 .autostatus - Auto view status
🔹 .anticall - Block callers
🔹 .pmblocker - Block private messages

Type *.help <command>* for detailed info

TITAN © ${new Date().getFullYear()} • Powered by ezio
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: helpMessage
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;