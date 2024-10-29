import { DateTime } from 'luxon';
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm';
import type { ManyToMany } from '@adonisjs/lucid/types/relations';
import Post from '#models/post';

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare uri: string;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => Post)
  declare posts: ManyToMany<typeof Post>;
}
