import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { SettingFactory } from '#database/factories/setting_factory';
import User from '#models/user';
import Setting from '#models/setting';

test.group('Settings destroy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should delete setting with valid key', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'Setting deleted',
    });

    // Verify setting is deleted
    const deletedSetting = await Setting.findBy('key', setting.key);
    assert.isNull(deletedSetting);
  });

  test('should delete setting with client group', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const setting = await SettingFactory.merge({ group: 'client' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/settings/${setting.key}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'Setting deleted',
    });

    // Verify setting is deleted
    const deletedSetting = await Setting.findBy('key', setting.key);
    assert.isNull(deletedSetting);
  });

  test('should fail to delete setting without authentication', async ({ client }) => {
    const setting = await SettingFactory.create();

    const response = await client.delete(`/v1/settings/${setting.key}`);

    response.assertStatus(401);
  });

  test('should fail to delete non-existent setting', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete('/v1/settings/non-existent-key')
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
