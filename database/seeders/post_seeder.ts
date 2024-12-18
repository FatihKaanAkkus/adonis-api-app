import { PostFactory } from '#database/factories/post_factory';
import { BaseSeeder } from '@adonisjs/lucid/seeders';

export default class extends BaseSeeder {
  async run() {
    await PostFactory.with('user').createMany(10);
    await PostFactory.with('user').with('categories', 3).createMany(10);
    await PostFactory.with('user').with('attachments', 3).createMany(10);
    await PostFactory.apply('post').with('user').with('categories', 3).createMany(10);
  }
}
