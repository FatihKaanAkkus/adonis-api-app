import { UserFactory } from '#database/factories/user_factory';
import { BaseSeeder } from '@adonisjs/lucid/seeders';

export default class extends BaseSeeder {
  async run() {
    await UserFactory.with('profile')
      .with('posts', 3, (builder) => builder.with('categories', 2))
      .createMany(10);
  }
}
