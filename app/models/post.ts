import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm';
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations';
import User from '#models/user';
import Category from '#models/category';
import Attachment from '#models/attachment';

export type PostType = 'post' | 'page';

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare type: PostType;

  @column()
  declare uri: string;

  @column()
  declare title: string;

  @column()
  declare description: string | null;

  @column()
  declare content: string;

  @column()
  declare coverImage: string | null;

  @column()
  declare userId: number | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @manyToMany(() => Category, { pivotTimestamps: true })
  declare categories: ManyToMany<typeof Category>;

  @manyToMany(() => Attachment, { pivotTimestamps: true })
  declare attachments: ManyToMany<typeof Attachment>;
}
