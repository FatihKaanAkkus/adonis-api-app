import { AttachmentFactory } from '#database/factories/attachment_factory';
import { BaseSeeder } from '@adonisjs/lucid/seeders';

export default class extends BaseSeeder {
  async run() {
    await AttachmentFactory.with('posts', 3).createMany(3);
  }
}
