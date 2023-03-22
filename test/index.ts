'use strict';

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import manager from '../src/manager';
import { errors } from '../src/constants';

const CLEAN_TEST_FILE_PATH = path.join(__dirname, './data/htpasswd'),
    WORKING_TEST_FILE_PATH = path.join(__dirname, './htpasswd'),
    NEW_TEST_FILE_PATH = path.join(__dirname, './newfile');

function reset() {
    if (!fs.existsSync(CLEAN_TEST_FILE_PATH)) {
        throw new Error('Clean test file does not exist!');
    }
    copyFile(CLEAN_TEST_FILE_PATH, WORKING_TEST_FILE_PATH);
}

function copyFile(srcPath: string, destPath: string) {
    if (fs.copyFileSync) {
        return fs.copyFileSync(srcPath, destPath);
    } else {
        const fileContents = fs.readFileSync(srcPath, {encoding: 'utf8'});
        fs.writeFileSync(destPath, fileContents, 'utf8');
    }
}

function removeFile(filePath: string) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

function cleanup() {
    removeFile(WORKING_TEST_FILE_PATH);
    removeFile(NEW_TEST_FILE_PATH);
}

function runTests() {
    let htpasswdManager = manager(WORKING_TEST_FILE_PATH);

    describe('htpasswd-mgr', () => {
        beforeEach(() => {
            reset();
            htpasswdManager = manager(WORKING_TEST_FILE_PATH);
        });

        it('listUsers()', async () => {
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith']);
            assert.equal(users.length, 1);
        });

        it('updateState()', async () => {
            let users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith']);
            assert.equal(users.length, 1);

            // Add a fake user
            fs.appendFileSync(WORKING_TEST_FILE_PATH, 'joeshmoe:$apr1$2iW.9QxR$V5Tm3PMhVgE/HzV3q5dbe/', 'utf8');

            // Update the state of the manager
            await htpasswdManager.updateState();
            users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith', 'joeshmoe']);
            assert.equal(users.length, 2);
        });

        it('updateFile()', async () => {
            await htpasswdManager.addUser('joeshmoe', 'test123', {export: false});
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith', 'joeshmoe']);
            assert.equal(users.length, 2);

            let fileContents = fs.readFileSync(WORKING_TEST_FILE_PATH, {encoding: 'utf8'});
            let splitLines = fileContents.split('\n').filter((line) => line); // Remove empty lines
                    
            assert.equal(splitLines.length, 1);

            await htpasswdManager.updateFile();

            fileContents = fs.readFileSync(WORKING_TEST_FILE_PATH, {encoding: 'utf8'});
            splitLines = fileContents.split('\n').filter((line) => line); // Remove empty lines
                    
            assert.equal(splitLines.length, 2);
        });

        it('addUser(username, password)', async () => {
            await htpasswdManager.addUser('joeshmoe', 'test123');
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith', 'joeshmoe']);
            assert.equal(users.length, 2);
        });

        it('addUser(username, password, options)', async () => {
            await htpasswdManager.addUser('joeshmoe', 'test123', {algorithm: 'crypt', export: true});
            const users = await htpasswdManager.listUsers();
                
            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith', 'joeshmoe']);
            assert.equal(users.length, 2);
        });

        it('addUser(existing username, password, options)', async () => {
            try {
                await htpasswdManager.addUser('johnsmith', 'test123', {algorithm: 'sha', export: true});
                throw new Error('An error was expected, but was not thrown.');
            } catch (err) {
                assert.equal(err instanceof Error ? err.message : '', errors.usernameAlreadyInUse);
            }
        });

        it('updateUser(username, password)', async () => {
            await htpasswdManager.updateUser('johnsmith', 'test123');
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith']);
            assert.equal(users.length, 1);
        });

        it('updateUser(username, password, options)', async () => {
            await htpasswdManager.updateUser('johnsmith', 'test123', {algorithm: 'sha'});
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith']);
            assert.equal(users.length, 1);
        });

        it('updateUser(new username, password, options)', async () => {
            try {
                await htpasswdManager.updateUser('joeshmoe', 'test123', {algorithm: 'md5'});
                throw new Error('An error was expected, but was not thrown.');
            } catch (err) {
                assert.equal(err instanceof Error ? err.message : '', errors.noSuchUser);
            }
        });

        it('upsertUser(new username, password)', async () => {
            await htpasswdManager.upsertUser('joeshmoe', 'test123');
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith', 'joeshmoe']);
            assert.equal(users.length, 2);
        });

        it('upsertUser(existing username, password)', async () => {
            await htpasswdManager.upsertUser('johnsmith', 'test123');
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith']);
            assert.equal(users.length, 1);
        });

        it('upsertUser(new username, password, options)', async () => {
            await htpasswdManager.upsertUser('joeshmoe', 'test123', {algorithm: 'bcrypt'});
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith', 'joeshmoe']);
            assert.equal(users.length, 2);
        });

        it('upsertUser(existing username, password, options)', async () => {
            await htpasswdManager.upsertUser('johnsmith', 'test123', {algorithm: 'md5'});
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith']);
            assert.equal(users.length, 1);
        });

        it('removeUser(username)', async () => {
            await htpasswdManager.removeUser('johnsmith');
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, []);
            assert.equal(users.length, 0);
        });

        it('removeUser(username, options)', async () => {
            await htpasswdManager.removeUser('johnsmith', {export: false});
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, []);
            assert.equal(users.length, 0);
        });

        it('removeUser(non-existent username, options)', async () => {
            await htpasswdManager.removeUser('joeshmoe', {export: false});
            const users = await htpasswdManager.listUsers();

            assert(users instanceof Array);
            assert.deepEqual(users, ['johnsmith']);
            assert.equal(users.length, 1);
        });

        it('htpasswdManager(new file path)', async () => {
            htpasswdManager = manager(NEW_TEST_FILE_PATH);
        });

        after(cleanup);
    });
}

runTests();
