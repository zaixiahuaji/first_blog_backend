import { BadRequestException } from '@nestjs/common';

export const INVITE_CODE_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export const ensureInviteCodeFormat = (code: string) => {
  if (!INVITE_CODE_REGEX.test(code)) {
    throw new BadRequestException(
      'Invite code must be in format XXXX-XXXX (A-Z/0-9).',
    );
  }
};

const INVITE_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const generateInviteCode = () => {
  let raw = '';
  for (let i = 0; i < 8; i += 1) {
    raw += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
};
