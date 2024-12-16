import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'posts';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.enum('type', ['post', 'page']).defaultTo('post');
      table.string('uri').unique();
      table.string('title');
      table.string('description');
      table.text('content');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');

      table.timestamp('created_at');
      table.timestamp('updated_at');
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
