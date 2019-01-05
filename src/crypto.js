const crypto = require('crypto'),
    bcryptLib = require('bcrypt'),

    SALT_ROUNDS = 5;

module.exports = {
    sha1: sha1,
    bcrypt: bcrypt
};

// Return a SHA1 representation of the value
function sha1(value) {
    let hash = crypto.createHash('sha1');
    hash.update(value);

    return hash.digest('base64');
}

function bcrypt(value) {
    let salt = bcryptLib.genSaltSync(SALT_ROUNDS);

    return bcryptLib.hashSync(value, salt);
}
