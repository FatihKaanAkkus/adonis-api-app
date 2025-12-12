import factory from '@adonisjs/lucid/factories';
import Setting from '#models/setting';

export const SettingFactory = factory
  .define(Setting, async ({ faker }) => {
    return {
      group: `client-app-${faker.string.uuid()}`,
      key: `setting-key-${faker.string.uuid()}`,
      value: `setting-value-${faker.string.uuid()}`,
    };
  })
  .build();
