import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm';
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations';
import Category from '#models/category';
import User from '#models/user';

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number | null;

  @column()
  declare uri: string;

  @column()
  declare title: string;

  @column()
  declare description: string | null;

  @column()
  declare content: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => Category)
  declare categories: ManyToMany<typeof Category>;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;
}
