const { admin, workgroup } = require('../config.json');

class Spark {
    constructor (client) {
        this.client = client;
        this.active = [];
    }
    
    onGroupMessage (session) {
        if (!admin.includes(session.user_id)) return;
        if (!workgroup.includes(session.group_id)) return;
        
    }
}

module.exports = Spark;