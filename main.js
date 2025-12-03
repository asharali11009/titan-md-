/**
 * TITAN by ezio - Main message handling
 */
const fs = require('fs');
const path = require('path');

// Check if a command file exists before requiring it
function safeRequire(commandPath) {
    try {
        return require(commandPath);
    } catch (error) {
        // console.log(`Command module not found: ${commandPath}`);
        return null;
    }
}

// Initialize command handlers (only those that actually exist)
const alive = safeRequire('./commands/alive');
const antibadword = safeRequire('./commands/antibadword');
const anticall = safeRequire('./commands/anticall');
const antidelete = safeRequire('./commands/antidelete');
const antilink = safeRequire('./commands/antilink');
const antitag = safeRequire('./commands/antitag');
const attp = safeRequire('./commands/attp');
const autoread = safeRequire('./commands/autoread');
const autostatus = safeRequire('./commands/autostatus');
const autotyping = safeRequire('./commands/autotyping');
const ban = safeRequire('./commands/ban');
const broadcast = safeRequire('./commands/broadcast');
const clearCmd = safeRequire('./commands/clear');
const clearsession = safeRequire('./commands/clearsession');
const cleartmp = safeRequire('./commands/cleartmp');
const deleteCmd = safeRequire('./commands/delete');
const demote = safeRequire('./commands/demote');
const emojimix = safeRequire('./commands/emojimix');
const goodbye = safeRequire('./commands/goodbye');
const goodnight = safeRequire('./commands/goodnight');
const groupinfo = safeRequire('./commands/groupinfo');
const groupManage = safeRequire('./commands/groupmanage');
const help = safeRequire('./commands/help');
const hidetag = safeRequire('./commands/hidetag');
const kick = safeRequire('./commands/kick');
const lyrics = safeRequire('./commands/lyrics');
const mention = safeRequire('./commands/mention');
const mute = safeRequire('./commands/mute');
const owner = safeRequire('./commands/owner');
const pair = safeRequire('./commands/pair');
const ping = safeRequire('./commands/ping');
const play = safeRequire('./commands/play');
const pmblocker = safeRequire('./commands/pmblocker');
const promote = safeRequire('./commands/promote');
const quote = safeRequire('./commands/quote');
const resetlink = safeRequire('./commands/resetlink');
const settings = safeRequire('./commands/settings');
const ship = safeRequire('./commands/ship');
const song = safeRequire('./commands/song');
const spotify = safeRequire('./commands/spotify');
const ss = safeRequire('./commands/ss');
const staff = safeRequire('./commands/staff');
const sticker = safeRequire('./commands/sticker');
const stickercrop = safeRequire('./commands/stickercrop');
const sudo = safeRequire('./commands/sudo');
const tag = safeRequire('./commands/tag');
const tagall = safeRequire('./commands/tagall');
const tagnotadmin = safeRequire('./commands/tagnotadmin');
const take = safeRequire('./commands/take');
const tictactoe = safeRequire('./commands/tictactoe');
const topmembers = safeRequire('./commands/topmembers');
const unban = safeRequire('./commands/unban');
const unmute = safeRequire('./commands/unmute');
const update = safeRequire('./commands/update');
const video = safeRequire('./commands/video');
const viewonce = safeRequire('./commands/viewonce');
const warn = safeRequire('./commands/warn');
const warnings = safeRequire('./commands/warnings');
const welcome = safeRequire('./commands/welcome');

// Safely get isAdmin function
let isAdmin;
try {
    isAdmin = require('./lib/isAdmin');
} catch (e) {
    isAdmin = async () => ({ isSenderAdmin: false, isBotAdmin: false });
}

// Safely get isBanned function
let isBanned;
try {
    isBanned = require('./lib/isBanned').isBanned;
} catch (e) {
    isBanned = () => false;
}

async function handleMessages(sock, chatUpdate, isPublic) {
    try {
        // Validate that we have messages to process
        if (!chatUpdate || !chatUpdate.messages || !Array.isArray(chatUpdate.messages) || chatUpdate.messages.length === 0) {
            return;
        }
        
        // Get the first message
        var message = chatUpdate.messages[0];
        if (!message || !message.key) return;
        
        // Get message content
        const msgContent = message.message || {};
        
        // Skip processing empty messages or system messages
        if (!msgContent || Object.keys(msgContent).length === 0) return;
        if (message.messageStubType) return;
        
        // Serialize the message for easier handling
        let m;
        try {
            m = sock.serializeM(message);
            if (!m.message) return;
        } catch (err) {
            console.error("Error serializing message:", err);
            return;
        }
        
        // Get basic info with additional checks
        const from = m.key.remoteJid;
        if (!from) return; // Skip if no recipient
        
        const isGroup = from.endsWith('@g.us');
        const pushname = m.pushName || 'User';
        const sender = m.key.fromMe ? (sock.user?.jid || '') : (isGroup ? m.key.participant : m.key.remoteJid) || '';
        if (!sender) return; // Skip if no sender
        
        const senderNumber = sender.split('@')[0];
        const botNumber = sock.user?.id?.split(':')[0] || '';
        
        // Check PM blocker if the module exists and we're in a private chat
        if (!isGroup && pmblocker) {
            try {
                // Check if sender is banned
                if (isBanned && isBanned(sender)) {
                    return;
                }
                
                // Check if PM blocker is enabled and not owner/sudo
                const pmState = pmblocker.readState();
                if (pmState && pmState.enabled && !m.key.fromMe && sender !== botNumber + '@s.whatsapp.net') {
                    await sock.sendMessage(from, { text: pmState.message });
                    return;
                }
            } catch (e) {
                console.log("PM Blocker error:", e);
            }
        }

        // Extract text from various message types with proper safety checks
        let userMessage = '';
        if (m.message?.conversation) {
            userMessage = m.message.conversation;
        } else if (m.message?.extendedTextMessage?.text) {
            userMessage = m.message.extendedTextMessage.text;
        } else if (m.message?.imageMessage?.caption) {
            userMessage = m.message.imageMessage.caption;
        } else if (m.message?.videoMessage?.caption) {
            userMessage = m.message.videoMessage.caption;
        }
        
        userMessage = userMessage.trim();
        
        // Skip if there's no user message
        if (!userMessage) return;
        
        // Split the message to extract command and parameters
        const parts = userMessage.split(' ');
        if (!parts || parts.length === 0) return;
        
        const command = parts[0].toLowerCase();
        const args = userMessage.slice(command.length).trim();
        
        // Get mentions and quoted message with safety checks
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;

        // Process commands - only call modules that exist
        switch (command) {
            case '.alive':
            case '.hi':
            case '.bot':
                if (alive) await alive(sock, from, m);
                break;
                
            case '.help':
            case '.menu':
                if (help) await help(sock, from, m);
                break;
                
            case '.ping':
                if (ping) await ping(sock, from, m);
                break;
                
            case '.owner':
                if (owner) await owner(sock, from);
                break;
                
            case '.kick':
                if (kick) await kick(sock, from, sender, mentionedJid, m);
                break;
                
            case '.ban':
                if (ban) await ban(sock, from, m);
                break;
                
            case '.unban':
                if (unban) await unban(sock, from, m);
                break;
                
            case '.promote':
                if (promote && typeof promote.promoteCommand === 'function') {
                    await promote.promoteCommand(sock, from, mentionedJid, m);
                }
                break;
                
            case '.demote':
                if (demote && typeof demote.demoteCommand === 'function') {
                    await demote.demoteCommand(sock, from, mentionedJid, m);
                }
                break;
                
            case '.mute':
                if (mute) {
                    const muteTime = parseInt(args.trim()) || undefined;
                    await mute(sock, from, sender, m, muteTime);
                }
                break;
                
            case '.unmute':
                if (unmute) await unmute(sock, from);
                break;
                
            case '.clear':
                if (clearCmd && typeof clearCmd.clearCommand === 'function') {
                    await clearCmd.clearCommand(sock, from);
                }
                break;

            case '.clearsession':
                if (clearsession) await clearsession(sock, from, m);
                break;

            case '.cleartmp':
                if (cleartmp) await cleartmp(sock, from, m);
                break;
                
            case '.tagall':
                if (tagall) await tagall(sock, from, sender, m);
                break;
                
            case '.tagnotadmin':
                if (tagnotadmin) await tagnotadmin(sock, from, sender, m);
                break;
                
            case '.hidetag':
                if (hidetag) await hidetag(sock, from, sender, args, quotedMessage, m);
                break;
                
            case '.tag':
                if (tag) await tag(sock, from, sender, args, quotedMessage, m);
                break;
                
            case '.delete':
            case '.del':
                if (deleteCmd) await deleteCmd(sock, from, m, sender);
                break;
                
            case '.groupinfo':
                if (groupinfo) await groupinfo(sock, from, m);
                break;
                
            case '.resetlink':
                if (resetlink) await resetlink(sock, from, sender);
                break;
                
            case '.setgdesc':
                if (groupManage && typeof groupManage.setGroupDescription === 'function') {
                    await groupManage.setGroupDescription(sock, from, sender, args, m);
                }
                break;
                
            case '.setgname':
                if (groupManage && typeof groupManage.setGroupName === 'function') {
                    await groupManage.setGroupName(sock, from, sender, args, m);
                }
                break;
                
            case '.setgpp':
                if (groupManage && typeof groupManage.setGroupPhoto === 'function') {
                    await groupManage.setGroupPhoto(sock, from, sender, m);
                }
                break;
                
            case '.sticker':
            case '.s':
            case '.stiker':
                if (sticker) await sticker(sock, from, m);
                break;
                
            case '.take':
                if (take) await take(sock, from, m, args);
                break;
                
            case '.crop':
            case '.stickercrop':
            case '.sc':
                if (stickercrop) await stickercrop(sock, from, m);
                break;
                
            case '.emojimix':
                if (emojimix) await emojimix(sock, from, m);
                break;
                
            case '.play':
                if (play) await play(sock, from, m);
                break;
                
            case '.song':
                if (song) await song(sock, from, m);
                break;
                
            case '.spotify':
                if (spotify) await spotify(sock, from, m);
                break;
                
            case '.ss':
            case '.screenshot':
            case '.ssweb':
                if (ss && typeof ss.handleSsCommand === 'function') {
                    await ss.handleSsCommand(sock, from, m, args);
                }
                break;
                
            case '.ship':
                if (ship) await ship(sock, from, m);
                break;
                
            case '.warn':
                if (warn) await warn(sock, from, sender, mentionedJid, m);
                break;
                
            case '.viewonce':
            case '.vo':
                if (viewonce) await viewonce(sock, from, m);
                break;
                
            case '.sudo':
                if (sudo) await sudo(sock, from, m);
                break;
                
            case '.pmblocker':
                if (pmblocker && typeof pmblocker.pmblockerCommand === 'function') {
                    await pmblocker.pmblockerCommand(sock, from, m, args);
                }
                break;
                
            case '.antilink':
                if (antilink && typeof antilink.handleAntilinkCommand === 'function') {
                    await antilink.handleAntilinkCommand(sock, from, userMessage, sender, isAdmin, m);
                }
                break;
                
            case '.antitag':
                if (antitag && typeof antitag.handleAntitagCommand === 'function') {
                    await antitag.handleAntitagCommand(sock, from, userMessage, sender, isAdmin, m);
                }
                break;
                
            case '.goodbye':
                if (goodbye && typeof goodbye.goodbyeCommand === 'function') {
                    await goodbye.goodbyeCommand(sock, from, m, args);
                }
                break;
                
            case '.goodnight':
                if (goodnight && typeof goodnight.goodnightCommand === 'function') {
                    await goodnight.goodnightCommand(sock, from, m);
                }
                break;
                
            case '.attp':
                if (attp) await attp(sock, from, m);
                break;
                
            case '.quote':
                if (quote) await quote(sock, from, m);
                break;
                
            case '.lyrics':
                if (lyrics) await lyrics(sock, from, m, args);
                break;
                
            case '.broadcast':
                if (broadcast) await broadcast(sock, from, m, args);
                break;
                
            case '.staff':
                if (staff) await staff(sock, from, m);
                break;
                
            case '.video':
                if (video) await video(sock, from, m);
                break;
                
            case '.update':
                if (update) await update(sock, from, m);
                break;
                
            case '.pair':
                if (pair) await pair(sock, from, m);
                break;
                
            case '.autotyping':
                if (autotyping && typeof autotyping.autotypingCommand === 'function') {
                    await autotyping.autotypingCommand(sock, from, m);
                }
                break;
                
            case '.autoread':
                if (autoread && typeof autoread.autoreadCommand === 'function') {
                    await autoread.autoreadCommand(sock, from, m);
                }
                break;
                
            case '.autostatus':
                if (autostatus && typeof autostatus.autoStatusCommand === 'function') {
                    await autostatus.autoStatusCommand(sock, from, m, args);
                }
                break;

            // Add other commands here as needed
        }

        // Process group moderation if modules exist and we're in a group
        if (isGroup) {
            try {
                // Antilink
                if (antilink && typeof antilink.Antilink === 'function') {
                    await antilink.Antilink(m, sock);
                }
                
                // Antibadword
                if (antibadword && typeof antibadword.handleBadwordDetection === 'function') {
                    await antibadword.handleBadwordDetection(sock, from, m, userMessage, sender);
                }
                
                // Antitag
                if (antitag && typeof antitag.handleTagDetection === 'function') {
                    await antitag.handleTagDetection(sock, from, m, sender);
                }
                
                // Mention detection
                if (mention && typeof mention.handleMentionDetection === 'function') {
                    await mention.handleMentionDetection(sock, from, m);
                }
            } catch (e) {
                console.log("Group moderation error:", e);
            }
        }

    } catch (e) {
        console.error("Error handling messages:", e);
    }
}

// Handle group participant updates (join/leave)
async function handleGroupParticipantUpdate(sock, update) {
    try {
        // Skip if update is invalid
        if (!update || !update.id || !update.participants || !Array.isArray(update.participants)) {
            return;
        }
        
        // Respect bot mode: only announce promote/demote in public mode
        let isPublic = true;
        try {
            if (fs.existsSync('./data/messageCount.json')) {
                const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
            }
        } catch (e) {
            // If reading fails, default to public behavior
        }

        // Handle promote/demote only in public mode
        if (update.action === 'promote') {
            if (!isPublic) return;
            
            if (promote && typeof promote.handlePromotionEvent === 'function') {
                try {
                    await promote.handlePromotionEvent(sock, update.id, update.participants, update.actor);
                } catch (e) {
                    console.log("Promotion handler error:", e);
                }
            }
        } else if (update.action === 'demote') {
            if (!isPublic) return;
            
            if (demote && typeof demote.handleDemotionEvent === 'function') {
                try {
                    await demote.handleDemotionEvent(sock, update.id, update.participants, update.actor);
                } catch (e) {
                    console.log("Demotion handler error:", e);
                }
            }
        } else if (update.action === 'add') {
            if (welcome && typeof welcome.handleJoinEvent === 'function') {
                try {
                    await welcome.handleJoinEvent(sock, update.id, update.participants);
                } catch (e) {
                    console.log("Welcome handler error:", e);
                }
            }
        } else if (update.action === 'remove') {
            if (goodbye && typeof goodbye.handleLeaveEvent === 'function') {
                try {
                    await goodbye.handleLeaveEvent(sock, update.id, update.participants);
                } catch (e) {
                    console.log("Goodbye handler error:", e);
                }
            }
        }
    } catch (error) {
        console.error("Error in handling group update:", error);
    }
}

// Handle status updates
async function handleStatus(sock, status) {
    try {
        if (!sock || !status) return;
        
        // Check if autostatus module exists
        if (autostatus && typeof autostatus.handleStatusUpdate === 'function') {
            try {
                await autostatus.handleStatusUpdate(sock, status);
            } catch (e) {
                // Silently ignore status update errors
            }
        }
    } catch (error) {
        // Silently ignore any status handling errors
    }
}

module.exports = { handleMessages, handleGroupParticipantUpdate, handleStatus };
