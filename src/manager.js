'use strict';

const {promisify} = require('bluebird'),
    fs = require('fs'),
    md5 = require('apache-md5'),
    crypt = require('apache-crypt'),
    writeFileAsync = promisify(fs.writeFile),
    
    utilities = require('./utilities'),
    
    DEFAULT_ALGORITHM = 'md5';


function initialize(path) {
    let htpasswd = {};
    
    const exports = {
        updateState: readFile,
        updateFile: exportToFile,
        addUser: addUser,
        updateUser: updateUser,
        upsertUser: addOrUpdateUser,
        removeUser: removeUser,
        listUsers: listUsers
    };
    
    function readFile() {
        if (fs.existsSync(path)) {
            let htpasswdContents = fs.readFileSync(path, {encoding: 'utf8'});
            parseFile(htpasswdContents);
        }
        return Promise.resolve();
    }
    
    function parseFile(fileContents) {
        let lines = fileContents.trim().split('\n');
        for(let line of lines) {
            let [username, password] = line.split(':');
            htpasswd[username] = [password];
        }
    }
    
    function exportToFile() {
        return convertHTPasswdToString()
            .then(writeFile);
    }
    
    function writeFile(data) {
        return writeFileAsync(path, data, {encoding: 'utf8'});
    }
    
    function convertHTPasswdToString() {
        let accumulator = '';
        
        for(let username in htpasswd) {
            let password = htpasswd[username];
            let userInfo = username + ':' + password + '\n';
            accumulator += userInfo;
        }
        
        return Promise.resolve(accumulator);
    }
    
    function encodePassword(password, algorithm) {
        switch(algorithm) {
            case 'crypt':
                return crypt(password);
            case 'sha':
                return utilities.sha1(password);
            case 'bcrypt':
                return utilities.bcrypt(password);
            case 'md5':
            default:
                return md5(password);
        }
    }
    
    function optionalExport(exportOption) {
        switch(exportOption) {
            case false:
                return Promise.resolve();
            default:
                return exportToFile();
        }
    }
    
    /**
     * Add a user to the htpasswd file and optionally export it to disk
     * @param username {String} name of user to be added
     * @param password {String} password for the user to be added
     * @param options {Object} object with options - example { algorithm: 'crypt', export: false }
     */
    function addUser(username, password, options) {
        if (htpasswd[username]) {
            return Promise.reject(new Error('A user with that username already exists.'));
        }
        
        return addOrUpdateUser(username, password, options);
    }
    
    function updateUser(username, password, options) {
        if (!htpasswd[username]) {
            return Promise.reject(new Error('A user with that username does not yet exist.'));
        }
        return addOrUpdateUser(username, password, options);
    }
    
    function addOrUpdateUser(username, password, options) {
        const algorithm = options && options.algorithm.toLowerCase(),
            exportOption = options && options.export;
        
        let encodedPassword = encodePassword(password, algorithm);
        
        htpasswd[username] = encodedPassword;
        
        return optionalExport(exportOption);
    }
    
    function removeUser(username, options) {
        const exportOption = options && options.export;
        
        delete htpasswd[username];
        
        return optionalExport(exportOption);
    }
    
    function listUsers() {
        return Promise.resolve(Object.keys(htpasswd));
    }
    
    // Update the internal state of the module
    readFile();
        
    return exports;
}

module.exports = initialize;