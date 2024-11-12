import factory from '@adonisjs/lucid/factories';
import Setting from '#models/setting';

export const SettingFactory = factory
  .define(Setting, async () => {
    return {};
  })
  .build();
