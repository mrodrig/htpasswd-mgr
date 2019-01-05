'use strict';

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "should" }]*/
let should = require('should'),
    fs = require('fs'),
    path = require('path'),
    manager = require('../src/manager'),
    constants = require('../src/constants');

const CLEAN_TEST_FILE_PATH = path.join(__dirname, './data/htpasswd'),
    WORKING_TEST_FILE_PATH = path.join(__dirname, './htpasswd'),
    NEW_TEST_FILE_PATH = path.join(__dirname, './newfile');

function reset() {
    if (!fs.existsSync(CLEAN_TEST_FILE_PATH)) {
        throw new Error('Clean test file does not exist!');
    }
    copyFile(CLEAN_TEST_FILE_PATH, WORKING_TEST_FILE_PATH);
}

function copyFile(srcPath, destPath) {
    if (fs.copyFileSync) {
        return fs.copyFileSync(srcPath, destPath);
    } else {
        let fileContents = fs.readFileSync(srcPath, {encoding: 'utf8'});
        fs.writeFileSync(destPath, fileContents, 'utf8');
    }
}

function removeFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

function cleanup() {
    removeFile(WORKING_TEST_FILE_PATH);
    removeFile(NEW_TEST_FILE_PATH);
}

function runTests() {
    let htpasswdManager;

    describe('htpasswd-mgr', () => {
        beforeEach(() => {
            reset();
            htpasswdManager = manager(WORKING_TEST_FILE_PATH);
        });

        it('listUsers()', (done) => {
            htpasswdManager.listUsers()
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith'])
                        .and.have.lengthOf(1);
                })
                .then(done)
                .catch(done);
        });

        it('updateState()', (done) => {
            htpasswdManager.listUsers()
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith'])
                        .and.have.lengthOf(1);
                })
                .then(() => {
                    // Add a fake user
                    fs.appendFileSync(WORKING_TEST_FILE_PATH, 'joeshmoe:$apr1$2iW.9QxR$V5Tm3PMhVgE/HzV3q5dbe/', 'utf8');
                })
                // Update the state of the manager
                .then(htpasswdManager.updateState)
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith', 'joeshmoe'])
                        .and.have.lengthOf(2);
                })
                .then(done)
                .catch(done);
        });

        it('updateFile()', (done) => {
            htpasswdManager.addUser('joeshmoe', 'test123', {export: false})
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith', 'joeshmoe'])
                        .and.have.lengthOf(2);

                    const fileContents = fs.readFileSync(WORKING_TEST_FILE_PATH, {encoding: 'utf8'});

                    fileContents.split('\n')
                        .filter((line) => line) // Remove empty lines
                        .should.have.lengthOf(1);
                })
                .then(htpasswdManager.updateFile)
                .then(() => {
                    const fileContents = fs.readFileSync(WORKING_TEST_FILE_PATH, {encoding: 'utf8'});

                    fileContents.split('\n')
                        .filter((line) => line) // Remove empty lines
                        .should.have.lengthOf(2);
                })
                .then(done)
                .catch(done);
        });

        it('addUser(username, password)', (done) => {
            htpasswdManager.addUser('joeshmoe', 'test123')
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith', 'joeshmoe'])
                        .and.have.lengthOf(2);
                })
                .then(done)
                .catch(done);
        });

        it('addUser(username, password, options)', (done) => {
            htpasswdManager.addUser('joeshmoe', 'test123', {algorithm: 'crypt', export: true})
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith', 'joeshmoe'])
                        .and.have.lengthOf(2);
                })
                .then(done)
                .catch(done);
        });

        it('addUser(existing username, password, options)', (done) => {
            htpasswdManager.addUser('johnsmith', 'test123', {algorithm: 'sha', export: true})
                .then(() => {
                    done(new Error('An error was expected, but was not thrown.'));
                })
                .catch((err) => {
                    err.message.should.equal(constants.errors.usernameAlreadyInUse);
                    done();
                });
        });

        it('updateUser(username, password)', (done) => {
            htpasswdManager.updateUser('johnsmith', 'test123')
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith'])
                        .and.have.lengthOf(1);
                })
                .then(done)
                .catch(done);
        });

        it('updateUser(username, password, options)', (done) => {
            htpasswdManager.updateUser('johnsmith', 'test123', {algorithm: 'sha'})
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith'])
                        .and.have.lengthOf(1);
                })
                .then(done)
                .catch(done);
        });

        it('updateUser(new username, password, options)', (done) => {
            htpasswdManager.updateUser('joeshmoe', 'test123', {algorithm: 'md5'})
                .then(() => {
                    done(new Error('An error was expected, but was not thrown.'));
                })
                .catch((err) => {
                    err.message.should.equal(constants.errors.noSuchUser);
                    done();
                });
        });

        it('upsertUser(new username, password)', (done) => {
            htpasswdManager.upsertUser('joeshmoe', 'test123')
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith', 'joeshmoe'])
                        .and.have.lengthOf(2);
                })
                .then(done)
                .catch(done);
        });

        it('upsertUser(existing username, password)', (done) => {
            htpasswdManager.upsertUser('johnsmith', 'test123')
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith'])
                        .and.have.lengthOf(1);
                })
                .then(done)
                .catch(done);
        });

        it('upsertUser(new username, password, options)', (done) => {
            htpasswdManager.upsertUser('joeshmoe', 'test123', {algorithm: 'bcrypt'})
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith', 'joeshmoe'])
                        .and.have.lengthOf(2);
                })
                .then(done)
                .catch(done);
        });

        it('upsertUser(existing username, password, options)', (done) => {
            htpasswdManager.upsertUser('johnsmith', 'test123', {algorithm: 'md5'})
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith'])
                        .and.have.lengthOf(1);
                })
                .then(done)
                .catch(done);
        });

        it('removeUser(username)', (done) => {
            htpasswdManager.removeUser('johnsmith')
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual([])
                        .and.have.lengthOf(0);
                })
                .then(done)
                .catch(done);
        });

        it('removeUser(username, options)', (done) => {
            htpasswdManager.removeUser('johnsmith', {export: false})
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual([])
                        .and.have.lengthOf(0);
                })
                .then(done)
                .catch(done);
        });

        it('removeUser(non-existent username, options)', (done) => {
            htpasswdManager.removeUser('joeshmoe', {export: false})
                .then(htpasswdManager.listUsers)
                .then((users) => {
                    users.should.be.an.instanceOf(Array)
                        .and.deepEqual(['johnsmith'])
                        .and.have.lengthOf(1);
                })
                .then(done)
                .catch(done);
        });

        it('htpasswdManager(new file path)', (done) => {
            htpasswdManager = manager(NEW_TEST_FILE_PATH);
            done();
        });

        after(cleanup);
    });
}

runTests();
