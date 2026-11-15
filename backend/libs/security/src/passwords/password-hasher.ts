import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

/** Custo do bcrypt exigido pelo projeto. */
export const PASSWORD_HASH_COST = 12;

/** Hash e comparacao de senhas com bcryptjs (implementacao JS pura, sem binario nativo). */
@Injectable()
export class PasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, PASSWORD_HASH_COST);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
