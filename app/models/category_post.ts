import { DateTime } from 'luxon';
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm';
import type { ManyToMany } from '@adonisjs/lucid/types/relations';
import Post from '#models/post';

export default class CategoryPost extends BaseModel {
  static table = 'category_post';

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare categoryId: number;

  @column()
  declare postId: number;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => Post, { pivotTimestamps: true })
  declare posts: ManyToMany<typeof Post>;
}
