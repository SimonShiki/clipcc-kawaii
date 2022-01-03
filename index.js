const { createClient } = require('oicq');
const config = require('./config.json');
const logger = require('./util/logger.js');
let components = {};

logger.info('==================================');
logger.info('          clipcc-cutie');
logger.info('       作者：SinanGentoo');
logger.info('==================================');
logger.info('读取配置文件并尝试创建实例...');
const client = createClient(config.qq, {
    log_level: config.debug_mode ? 'mark' : 'off',
    platform: config.platform
});
logger.info('尝试登录...');
login();

function login () {
    if (!config.password || config.password === null) {
        // 未设置密码，扫码登录
        client.on('system.login.qrcode', function (e) {
            //扫码后按回车登录
            process.stdin.once('data', () => this.login())
        }).login();
    } else {
        client.on('system.login.slider', function (e) {
            logger.log('本次登录需要滑动验证码，请在验证后输入ticket并回车。')
            process.stdin.once('data', (ticket) => this.submitSlider(ticket))
        }).login(config.password);
    }
    
    client.on('system.online', () => {
        logger.info('已登录!开始加载组件...');
        loadComponents();
    });
}

function loadComponents () {
    // 加载组件
    for (const componentId in config.components) {
        const name = config.components[componentId];
        try {
            const Component = require(`./components/${name}`);
            components[name] = new Component(client);
            components[name].activate();
            logger.info(`组件 ${name} 已被激活!`);
        } catch (e) {
            logger.error(`加载组件 ${name} 时发生错误: ${e}`);
        }
    }
    
    // 设置触发事件
    client.on('message.group', async (e) => {
        for (const id in components) components[id].onGroupMessage(e);
    });
    client.on('message.private', async (e) => {
        for (const id in components) components[id].onPrivateMessage(e);
    });
    client.on('request.friend', async (e) => {
        for (const id in components) components[id].onRequestFriend(e);
    });
}