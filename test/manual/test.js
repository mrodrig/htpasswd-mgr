let manager = require('../../src/manager.js');
const filePath = './data/htpasswd';

let htpasswdManager = manager(filePath);

htpasswdManager.addUser('user', 'pass123');