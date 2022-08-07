const config = require('../config.json');

class Yejun {
    constructor (client) {
        this.client = client;
    }
    
    isInList (msg) {
        for (let taco of config.rbq) {
            if (msg.indexOf(taco) !== -1) return true;
        }
        return false;
    }
    
    onGroupMessage (session) {
        if (config.workgroup.includes(session.group_id) && this.isInList(session.raw_message)) {
            this.client.setGroupBan(session.group_id, session.user_id, 60);
            session.recall();
        }
    }
}

module.exports = Yejun;