import { hash, verify } from "@node-rs/argon2";
import { sha1 } from "@oslojs/crypto/sha1";
import { encodeHexLowerCase } from "@oslojs/encoding";

const PIN_SALT = process.env.PIN_SALT;

if (!PIN_SALT) {
  throw new Error(
    "PIN_SALT environment variable is not set. Please configure it in your .env file."
  );
}

export async function hashPin(pin: string): Promise<string> {
  const saltedPin = PIN_SALT + pin;
  return await hash(saltedPin, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPin(
  pin: string,
  hashedPin: string
): Promise<boolean> {
  const saltedPin = PIN_SALT + pin;
  return await verify(hashedPin, saltedPin);
}

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPasswordHash(
  hash: string,
  password: string
): Promise<boolean> {
  return await verify(hash, password);
}

export async function verifyPasswordStrength(
  password: string
): Promise<boolean> {
  if (password.length < 8 || password.length > 255) {
    return false;
  }
  const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
  const hashPrefix = hash.slice(0, 5);
  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${hashPrefix}`
  );
  const data = await response.text();
  const items = data.split("\n");
  for (const item of items) {
    const hashSuffix = item.slice(0, 35).toLowerCase();
    if (hash === hashPrefix + hashSuffix) {
      return false;
    }
  }
  return true;
}
