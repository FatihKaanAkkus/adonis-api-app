import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { SettingFactory } from '#database/factories/setting_factory';
import User from '#models/user';

test.group('Settings show', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get setting by key', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.merge({
      key: 'test-setting',
      value: 'test value',
      group: 'client-app',
    }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      key: 'test-setting',
      value: 'test value',
      group: 'client-app',
    });
    assert.properties(response.body(), ['id', 'key', 'value', 'group', 'createdAt']);
  });

  test('should get setting with client group', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.merge({
      group: 'client',
      key: 'client-theme',
      value: 'dark',
    }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      group: 'client',
      key: 'client-theme',
    });
  });

  test('should fail to get setting without authentication', async ({ client }) => {
    const setting = await SettingFactory.merge({
      group: 'client',
      key: 'unauthenticated-setting',
      value: 'some value',
    }).create();

    const response = await client.get(`/v1/settings/${setting.key}`);

    response.assertStatus(401);
  });

  test('should fail to get non-existent setting', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/settings/non-existent-key')
      .bearerToken(token.value!.release());

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
});
