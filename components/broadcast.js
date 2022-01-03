const logger = require('../util/logger.js');
const config = require('../config.json');

class Broadcast {
    constructor (client) {
        this.client = client;
    }

    activate () {
        logger.info('大喇叭组件加载成功！');
    }
    
    onPrivateMessage (session) {
        if (session.raw_message.slice(0,3) == '大喇叭') {
            this.broadcast(session.message);
            session.reply('大喇叭已推送!', true);
        }
    }
    
    async broadcast (message) {
        const fresh = message;
        fresh[0].text = fresh[0].text.slice(4);
        for (const groupid of config.broadcast_group) {
            this.client.sendGroupMsg(groupid, fresh);
            logger.info('群聊' + groupid + '推送成功!');
            await this.sleep(5000);
        }
    }

    sleep (ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }
}

module.exports = Broadcast;