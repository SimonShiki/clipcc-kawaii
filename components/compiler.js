const process = require('child_process');
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage('./compiler');

const config = require('../config.json');
const logger = require('../util/logger.js');

class Compiler {
    constructor (client) {
        storage.setItem('lock', 'unlocked');
        this.client = client;
    }

    activate () {
        logger.info('编译组件加载成功！');
    }
    
    onGroupMessage (session) {
        if (session.raw_message === '编译下预览站') {
            if (this.isInList(session.user_id)) {
                if (storage.getItem('lock') !== 'locked') {
                    storage.setItem('lock', 'locked');
                    this.compile(session);
                } else session.reply("🔒已有一个进程正在运行")
            } else session.reply('权限不足', true);
        }
        if (session.raw_message == '更新下预览站') {
            if (this.isInList(session.user_id)) {
                if (storage.getItem('lock') !== 'locked') {
                    storage.setItem('lock', 'locked');
                    this.update(session);
                } else session.reply("🔒已有一个进程正在运行")
            } else session.reply('权限不足', true);
        }
    }
    
    isInList (id) {
        const isAdmin = config.admin.includes(id);
        return isAdmin;
    }

    async compile (session) {
        session.reply('🔧预览站编译中...', true);
        try {
            process.exec('bash ' + config.rebuild_script, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error !== null) session.reply('😞预览站编译失败了...\n请及时联系楠或Alex进行修复！', true);
                else session.reply('🎉预览站编译成功啦\n预览站地址：https://codingclip.com/editor/dev/canary', true);
                storage.setItem('lock', 'unlocked');
                logger.debug(stdout);
            });
        } catch (e) {
            logger.error('重编译期间出现错误：' + e);
        }
    }
    
    async update (session) {
        session.reply('🔧预览站更新中...', true);
        try {
            process.exec('bash ' + config.update_script, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error !== null) session.reply('😞预览站更新失败了...\n请及时联系楠或Alex进行修复！', true);
                else session.reply('🎉预览站更新成功啦\n预览站地址：https://codingclip.com/editor/dev/canary', true);
                storage.setItem('lock', 'unlocked');
                logger.debug(stdout);
            });
        } catch (e) {
            logger.error('更新期间出现错误：' + e);
        }
    }
}

module.exports = Compiler;