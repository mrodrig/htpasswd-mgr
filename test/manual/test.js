let manager = require('../../src/manager.js');
const filePath = './data/htpasswd',
    nonExistentPath = './fakefile';

let htpasswdManager = manager(nonExistentPath);

htpasswdManager.addUser('user', 'pass123');