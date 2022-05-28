const logger = require('../util/logger.js');
const { binding } = require('../config.json');

class GuildForward {
    constructor (client, guild) {
        this.client = client;
        this.guild = guild;
    }
    
    onGroupMessage (session) {
        if (session.group_id == this.tgroup) {
            this.tchannel.sendMessage(`[群聊] ${session.sender.nickname}: ${session.raw_message}`);
        }
    }
    
    onGuildReady (session) {
        const { guild_id, channel } = binding[0];
        this.tgroup = binding[1];
        const guild = this.guild.guilds.get(guild_id);
        this.tchannel = guild.channels.get(channel);
    }
    
    onGuildMessage (session) {
        const { guild_id, channel } = binding[0];
        if (session.guild_id != guild_id) return;
        if (session.channel_id != channel) return;
        if (session.sender.tiny_id == this.guild.tiny_id) return;
        this.client.sendGroupMsg(parseInt(binding[1]), `[频道] ${session.sender.nickname}: ${session.raw_message}`)
    }
}

module.exports = GuildForward;