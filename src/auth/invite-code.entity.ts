import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'invite_codes' })
export class InviteCode {
  @PrimaryColumn({ length: 9 })
  code: string;

  @Column({ length: 20 })
  role: string;

  @Column({ default: true })
  enabled: boolean;
}
