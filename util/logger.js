const colors = require('colors');
const config = require('../config.json');

class Logger {
    static info(msg) {
        console.log(colors.green("[INFO] "), msg);
    }

    static warn(msg) {
        console.log(colors.yellow("[WARN] "), msg);
    }

    static error(msg) {
        console.log(colors.red("[ERROR] "), msg);
    }

    static debug(msg) {
        if (config.debug_mode) console.debug(colors.blue("[DEBUG] "), msg);
    }
}

module.exports = Logger;