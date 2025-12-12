import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { SettingFactory } from '#database/factories/setting_factory';
import User from '#models/user';

test.group('Settings update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should update setting value', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.merge({
      group: 'client-app',
      key: 'theme',
      value: 'light',
    }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release())
      .json({
        value: 'dark',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      group: 'client-app',
      key: 'theme',
      value: 'dark',
    });

    await setting.refresh();
    assert.equal(setting.value, 'dark');
  });

  test('should update setting group', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.merge({
      group: 'client-app',
      key: 'config',
      value: 'test',
    }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release())
      .json({
        group: 'client-admin',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      group: 'client-admin',
      key: 'config',
    });

    await setting.refresh();
    assert.equal(setting.group, 'client-admin');
  });

  test('should update setting value and group', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.merge({
      group: 'client-app',
      key: 'option',
      value: 'old',
    }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release())
      .json({
        group: 'client-admin',
        value: 'new',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      group: 'client-admin',
      key: 'option',
      value: 'new',
    });

    await setting.refresh();
    assert.equal(setting.value, 'new');
    assert.equal(setting.group, 'client-admin');
  });

  test('should update setting with key field in payload', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.merge({
      group: 'client-app',
      key: 'test-setting',
      value: 'value1',
    }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release())
      .json({
        key: 'test-setting',
        value: 'updated',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      key: 'test-setting',
      value: 'updated',
    });

    await setting.refresh();
    assert.equal(setting.value, 'updated');
  });

  test('should fail to update setting without authentication', async ({ client }) => {
    const setting = await SettingFactory.merge({ group: 'client-app' }).create();

    const response = await client.put(`/v1/settings/${setting.key}`).json({
      value: 'new value',
    });

    response.assertStatus(401);
  });

  test('should fail to update non-existent setting', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put('/v1/settings/non-existent')
      .bearerToken(token.value!.release())
      .json({
        value: 'test',
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'params.id',
          rule: 'database.exists',
        },
      ],
    });
  });

  test('should fail to update setting with group not starting with client-', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.merge({ group: 'client-app' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release())
      .json({
        value: 'test',
        group: 'admin',
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'group',
          rule: 'startsWith',
        },
      ],
    });
  });
});
