# htpasswd-mgr - The HTPasswd Manager for Node

[![Dependencies](https://img.shields.io/david/mrodrig/htpasswd-mgr.svg?style=flat-square)](https://www.npmjs.org/package/htpasswd-mgr)
[![Downloads](http://img.shields.io/npm/dm/htpasswd-mgr.svg)](https://www.npmjs.org/package/htpasswd-mgr)
[![NPM version](https://img.shields.io/npm/v/htpasswd-mgr.svg)](https://www.npmjs.org/package/htpasswd-mgr)

This module was developed to simplify the management of .htpasswd files from
a Node.js application. Specifically, it's intended to allow for the addition,
modification, and deletion of users programmatically from inside a Node 
application.

# Usage

```javascript
let manager = require('htpasswd-mgr'),
    htpasswdManager = manager('./.htpasswd');
    
// Add a user with username 'john' and password 'password123' via the 'crypt' algorithm
htpasswdManager.addUser('john', 'password123', { algorithm: 'crypt', export: false });
```

## Intializing

First, the module must be initialized with a String `path` to an htpasswd file.
Once initialized, a set of functions will be returned which allow for the
manipulation of the data in that file. Those functions will be covered in the
following sections.

Note: A single instance of the `htpasswd-mgr` can be used to manage multiple
htpasswd files.

## updateState

`htpasswdManager.updateState()`

This function updates the internal state of the module to be consistent with the
current file as it exists on the file system.  This exists as a hook for 
programmatically allowing the module to remain up-to-date if changes are made
directly to the underlying htpasswd file. Ideally, this function should not need
to be called.

Returns: `Promise`

## updateFile

`htpasswdManager.updateFile()`

This function updates the htpasswd file on the file system to be consistent with
the current state of the module. This is provided in case a number of updates
will be made to the htpasswd file so that each `addUser` call does not need to
write the file to the disk. Instead, with this function, one could add several
users to the htpasswd file and then manually call this function to write the
file out to disk.

Returns: `Promise`

## addUser

`htpasswdManager.addUser(username, password, options)`

This function adds a user to the htpasswd file. It is not intended to update
user accounts. Attempting to update an account with this function will result in
an error via `Promise.reject`.

* `username` - `String` - The username of the user to be added.
* `password` - `String` - The password of the user to be added.
* `options`  - `Object` - An object specifying the specific functionality.
    * `options.algorithm` - `String` - `'crypt'`, `'bcrypt'`, `'sha'`, or `'md5'`. Default: `'md5'`
    * `options.export`    - `Boolean` - Should the module state be exported to the htpasswd file? Default: `true`
    
Returns: `Promise`

## updateUser

`htpasswdManager.updateUser(username, password, options)`

This function updates a user to the htpasswd file. It is not intended to add
user accounts. Attempting to add an account with this function will result in an
error via `Promise.reject`.

* `username` - `String` - The username of the user to be updated.
* `password` - `String` - The password of the user to be updated.
* `options`  - `Object` - An object specifying the specific functionality.
	* `options.algorithm` - `String` - `'crypt'`, `'bcrypt'`, `'sha'`, or `'md5'`. Default: `'md5'`
    * `options.export`    - `Boolean` - Should the module state be exported to the htpasswd file? Default: `true`

Returns: `Promise`

## upsertUser

`htpasswdManager.upsertUser(username, password, options)`

This function allows for an account with the provided username to be added or 
updated without worrying about a rejected Promise if the user account already
exists (in the case of adding a new user), or if the account does not exist (in
the case of updating a user).  This provides a means of overriding any existing
account and updating it with the provided values.

* `username` - `String` - The username of the user to be upserted.
* `password` - `String` - The password of the user to be upserted.
* `options`  - `Object` - An object specifying the specific functionality.
	* `options.algorithm` - `String` - `'crypt'`, `'bcrypt'`, `'sha'`, or `'md5'`. Default: `'md5'`
    * `options.export`    - `Boolean` - Should the module state be exported to the htpasswd file? Default: `true`

Returns: `Promise`

## removeUser

`htpasswdManager.removeUser(username, options)`

This function removes a user from the htpasswd file.

* `username` - `String` - The username of the user to be updated.
* `options`  - `Object` - An object specifying the specific functionality.
    * `options.export`    - `Boolean` - Should the module state be exported to the htpasswd file? Default: `true`
    
Returns: `Promise`

## listUsers

`htpasswdManager.listUsers()`

This function will return an array of the users currently in the htpasswd file.

Returns: `Array[String]`

# Tests

Coming soon!