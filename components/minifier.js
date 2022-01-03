const logger = require('../util/logger.js');
const dayjs = require('dayjs');
const config = require('../config.json');
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage('./minifier');

class Minifier {
    constructor (client) {
        this.client = client;
    }
    
    activate () {
        logger.info('Scratch小助手混淆功能组件加载成功!');
    }
    
    onPrivateMessage (session) {
        if (session.raw_message === '项目混淆') {
            if (!this.isInList(session.user_id)) {
                session.reply('您不在管理/可信用户名单内!');
                return ;
            }
            const attempt = parseInt(0 | this.getInfo(session.user_id, attempt));
            const status = this.getInfo(session.user_id, status);
            if (attempt < 3) {
                if(status === 'idle') {
                    session.reply("请将您要混淆的文件发送给机器人，仅接受sb2/sb3。");
                    this.setInfo(session.user_id, status, 'pending');
                } else session.reply('请您依照正常流程执行指令 (´ー｀)')
            }
        }
    }
    
    getInfo (visitorId, key) {
        // Refresh
        const now = dayjs().format('DD/MM/YYYY');
        if (storage.getItem('date') !== now) {
            storage.setItem('visitors', '{}');
            storage.setItem('date', now);
        }
        
        const originalValue = JSON.parse(storage.getItem('visitors'));
        if (!originalValue.hasOwnProperty(visitorId)) {
            originalValue[visitorId] = {
                status: 'idle',
                attempt: 0
            };
        }
        return originalValue[visitorId][key];
    }
    
    setInfo (visitorId, key, value) {
        const originalValue = JSON.parse(storage.getItem('visitors'));
        if (!originalValue.hasOwnProperty(visitorId)) {
            originalValue[visitorId] = {
                status: 'idle',
                attempt: 0
            };
        }
        originalValue[visitorId][key] = value;
        storage.setItem('visitors', JSON.stringify(originalValue));
    }
    
    isInList (id) {
        const isAdmin = config.admin.includes(id);
        const isUser = config.admin.includes(id);
        return isAdmin || isUser;
    }
}

module.exports = Minifier;