import { createHash } from 'crypto';
import { genSaltSync, hashSync } from 'bcrypt';

const SALT_ROUNDS = 5;

// Return a SHA1 representation of the value
export function sha1(value: string) {
    const hash = createHash('sha1');
    hash.update(value);

    return hash.digest('base64');
}

export function bcrypt(value: string) {
    const salt = genSaltSync(SALT_ROUNDS);

    return hashSync(value, salt);
}
