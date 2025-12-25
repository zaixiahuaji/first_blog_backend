import { BadRequestException } from '@nestjs/common';

export const ensureUsernameRules = (username: string) => {
  if (!/^[\p{L}\p{N}_]+$/u.test(username) || username.length > 12) {
    throw new BadRequestException(
      'Username must be 1-12 chars, only letters/numbers/underscore.',
    );
  }
};

export const ensurePasswordRules = (password: string) => {
  if (!/^[A-Za-z0-9]{1,10}$/.test(password)) {
    throw new BadRequestException(
      'Password must be 1-10 chars, letters/numbers only.',
    );
  }
};
