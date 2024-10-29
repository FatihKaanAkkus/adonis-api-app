import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'category_post';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('category_id').unsigned().references('categories.id').onDelete('CASCADE');
      table.integer('post_id').unsigned().references('posts.id').onDelete('CASCADE');
      table.unique(['post_id', 'category_id']);

      table.timestamp('created_at');
      table.timestamp('updated_at');
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
