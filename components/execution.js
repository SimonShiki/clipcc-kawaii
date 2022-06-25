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
        this.handleRequest(session, 'cpp', '10.2.0');
        this.handleRequest(session, 'javascript', '1.7.5');
        this.handleRequest(session, 'python3', '3.1.10');
        this.handleRequest(session, 'go', '1.16.2');
        this.handleRequest(session, 'lua', '5.4.2');
        this.handleRequest(session, 'bash', '5.1.0');
    }
    
    async handleRequest (session, language, version) {
        const command = `!${language} `;
        if (!session.raw_message.startsWith(command)) return;
        if (!admin.includes(session.user_id)) return;
        if (!this.sandbox) session.reply('沙箱仍在初始化中');
        
        session.reply('编译中...', true);
        const result = await this.sandbox.execute({
            language: language,
            version: version
        }, session.raw_message.slice(command.length));
        if (stderr in result.compile) {
            let result = `编译失败:\n${result.compile.stderr}:`;
            session.reply(result.trim());
        }
        let result = `STDOUT:\n${result.run.stdout}`;
        if (stderr in result.run) result += '\nSTDERR:\n' + result.run.stderr;
        else session.reply(result.trim(), true);
    };
}

module.exports = Execution;
