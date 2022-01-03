const logger = require('../util/logger.js');
const dayjs = require('dayjs');
const fs = require('fs');
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage('./visitor-list');

class Main {
    constructor (client) {
        this.client = client;
    }
    
    activate () {
        logger.info('Scratch小助手主要功能组件加载成功!');
    }
    
    onGroupMessage (session) {
        if (session.raw_message === '小助手指令') {
            const attempt = parseInt(0 | this.getItem(session.user_id));
            const help = '这里是Scratch小助手！以下是本助手可以做到的事,有事请私聊唷~\n' +
            '(您已回复' + (attempt + 1) + '次, 为防止风控故每人每天仅可回复三次。)\n' +
            '项目比对 - 帮助快速识别疑似侵权作品，有次数限制\n' +
            '项目混淆 - 通过混淆项目达到保护作品权益的目的，有成员与次数限制';
            if (attempt < 3) {
                session.reply(help);
                this.setItem(session.user_id, attempt + 1);
            }
        }
    }
    
    onPrivateMessage (session) {
        if (session.raw_message === '小助手指令') {
            const attempt = parseInt(0 | this.getItem(session.user_id));
            const help = '这里是Scratch小助手！以下是本助手可以做到的事,有事请私聊唷~\n' +
            '(您已回复' + (attempt + 1) + '次, 为防止风控故每人每天仅可回复三次。)\n' +
            '项目比对 - 帮助快速识别疑似侵权作品，有次数限制\n' +
            '项目混淆 - 通过混淆项目达到保护作品权益的目的，有成员与次数限制';
            if (attempt < 3) {
                session.reply(help);
                this.setItem(session.user_id, attempt + 1);
            }
        }
    }
    
    getItem (key) {
        // Refresh
        const now = dayjs().format('DD/MM/YYYY');
        if (storage.getItem('date') !== now) {
            storage.setItem('visitors', '{}');
            storage.setItem('date', now);
        }
        
        const originalValue = JSON.parse(storage.getItem('visitors'));
        return originalValue[key];
    }
    
    setItem (visitorId, value) {
        const originalValue = JSON.parse(storage.getItem('visitors'));
        originalValue[visitorId] = value;
        storage.setItem('visitors', JSON.stringify(originalValue));
    }
}

module.exports = Main;