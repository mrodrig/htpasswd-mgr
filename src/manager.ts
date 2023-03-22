'use strict';

import { existsSync, readFileSync, writeFile } from 'fs';
import md5 from 'apache-md5';
import crypt from 'apache-crypt';
import { sha1, bcrypt } from './crypto';
import { errors } from './constants';

export enum HTPasswdAlgorithms {
    crypt = 'crypt',
    sha = 'sha',
    bcrypt = 'bcrypt',
    md5 = 'md5',
}

export interface HTPasswdBaseOptions {
    export?: boolean;
}

export interface HTPasswdOptions extends HTPasswdBaseOptions {
    algorithm?: keyof typeof HTPasswdAlgorithms
}

const defaultOptions: Required<HTPasswdOptions> = {
    export: true,
    algorithm: HTPasswdAlgorithms.md5,
};

function initialize(path: string) {
    const htpasswd: Record<string, string> = {};

    async function readFile() {
        if (existsSync(path)) {
            const htpasswdContents = readFileSync(path, {encoding: 'utf8'});
            parseFile(htpasswdContents);
        }
        return;
    }

    function parseFile(fileContents: string) {
        const lines = fileContents.trim().split('\n');
        for (const line of lines) {
            const splitLine = line.split(':');
            const [username, password] = splitLine;
            htpasswd[username] = password;
        }
    }

    async function exportToFile() {
        const fileData = await convertHTPasswdToString();
        await writeToFile(fileData);
    }

    function writeToFile(data: string) {
        return new Promise((resolve, reject) => {
            writeFile(path, data, {encoding: 'utf8'}, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    }

    async function convertHTPasswdToString() {
        let accumulator = '';

        for (const username in htpasswd) {
            const password = htpasswd[username],
                userInfo = username + ':' + password + '\n';
            accumulator += userInfo;
        }

        return accumulator;
    }

    function encodePassword(password: string, algorithm: keyof typeof HTPasswdAlgorithms) {
        switch (algorithm?.toLowerCase()) {
            case 'crypt':
                return crypt(password);
            case 'sha':
                return sha1(password);
            case 'bcrypt':
                return bcrypt(password);
            case 'md5':
            default:
                return md5(password);
        }
    }

    async function optionalExport(exportOption: boolean) {
        switch (exportOption) {
            case false:
                return ;
            default:
                return exportToFile();
        }
    }

    /**
     * Add a user to the htpasswd file and optionally export it to disk
     */
    async function addUser(username: string, password: string, options?: HTPasswdOptions) {
        if (htpasswd[username]) {
            throw new Error(errors.usernameAlreadyInUse);
        }

        return addOrUpdateUser(username, password, options);
    }

    async function updateUser(username: string, password: string, options?: HTPasswdOptions) {
        if (!htpasswd[username]) {
            throw new Error(errors.noSuchUser);
        }
        return addOrUpdateUser(username, password, options);
    }

    function addOrUpdateUser(username: string, password: string, options?: HTPasswdOptions) {
        const algorithm = options?.algorithm ?? defaultOptions.algorithm,
            exportOption = options?.export ?? defaultOptions.export;

        htpasswd[username] = encodePassword(password, algorithm);

        return optionalExport(exportOption);
    }

    function removeUser(username: string, options?: HTPasswdBaseOptions) {
        const exportOption = options?.export ?? defaultOptions.export;

        delete htpasswd[username];

        return optionalExport(exportOption);
    }

    async function listUsers() {
        return Object.keys(htpasswd);
    }

    // Update the internal state of the module
    readFile();

    return {
        updateState: readFile,
        updateFile: exportToFile,
        addUser,
        updateUser,
        upsertUser: addOrUpdateUser,
        removeUser,
        listUsers,
    };
}

export default initialize;
