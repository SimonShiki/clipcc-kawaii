const { admin } = require('../config.json');

class Execution {
    constructor (client) {
        this.client = client;
        this.initialize();
    }
    
    async initialize () {
        try {
            const { piston } = await import('piston-client');
            this.sandbox = piston({});
        } catch (e) {
            console.log('failed to load piston', e);
        }
    }
    
    async onGroupMessage (session) {
        this.handleCpp(session);
        this.handleJs(session);
    }
    
    async handleCpp (session) {
        if (!session.raw_message.startsWith('!cpp ')) return;
        if (!admin.includes(session.user_id)) return;
        if (!this.sandbox) session.reply('沙箱仍在初始化中');
        session.reply('编译中...', true);
        const result = await this.sandbox.execute({
            language: 'cpp',
            version: '10.2.0'
        }, session.raw_message.slice(5));
        if (result.run.stderr) session.reply('运行失败:\n' + result.compile.stderr, true)
        else session.reply('运行结果:\n' + result.run.stdout, true);
    }
    
    async handleJs (session) {
        if (!session.raw_message.startsWith('!js ')) return;
        if (!admin.includes(session.user_id)) return;
        if (!this.sandbox) session.reply('沙箱仍在初始化中');
        session.reply('编译中...', true);
        const result = await this.sandbox.execute({
            language: 'javascript',
            version: '1.7.5'
        }, session.raw_message.slice(4));
        if (result.run.stderr) session.reply('运行失败:\n' + result.compile.stderr, true)
        else session.reply('运行结果:\n' + result.run.stdout, true);
    }
    
    async handlePy3 (session) {
        if (!session.raw_message.startsWith('!py ')) return;
        if (!admin.includes(session.user_id)) return;
        if (!this.sandbox) session.reply('沙箱仍在初始化中');
        session.reply('编译中...', true);
        const result = await this.sandbox.execute({
            language: 'python3',
            version: '3.10.0'
        }, session.raw_message.slice(4));
        if (result.run.stderr) session.reply('运行失败:\n' + result.compile.stderr, true)
        else session.reply('运行结果:\n' + result.run.stdout, true);
    }
}

module.exports = Execution;
