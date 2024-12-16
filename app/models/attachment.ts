import { DateTime } from 'luxon';
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm';
import type { ManyToMany } from '@adonisjs/lucid/types/relations';
import Post from '#models/post';

export default class Attachment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare ext: string;

  @column()
  declare path: string;

  @column()
  declare size: number;

  @column()
  declare title: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => Post, { pivotTimestamps: true })
  declare posts: ManyToMany<typeof Post>;
}
