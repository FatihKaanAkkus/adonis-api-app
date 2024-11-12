import Setting from '#models/setting';
import { BaseSeeder } from '@adonisjs/lucid/seeders';

export default class extends BaseSeeder {
  async run() {
    await Setting.create({ group: 'app', key: 'app-name', value: 'Mgt Adonis App' });
    await Setting.create({ group: 'app', key: 'app-default-language', value: 'en' });
    await Setting.create({ group: 'app', key: 'app-default-timezone', value: 'UTC+3' });
  }
}
