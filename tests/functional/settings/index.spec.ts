import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { SettingFactory } from '#database/factories/setting_factory';
import User from '#models/user';

test.group('Settings index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get paginated list of settings with default settings', async ({
    client,
    assert,
  }) => {
    const authenticatedUser = await UserFactory.create();
    await SettingFactory.createMany(5);
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/settings').bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.properties(response.body(), ['meta', 'data']);
    assert.equal(response.body().meta.perPage, 10);
    assert.equal(response.body().meta.currentPage, 1);
    assert.isAtLeast(response.body().data.length, 5);
  });

  test('should paginate settings with custom page and perPage', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await SettingFactory.createMany(15);
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/settings')
      .qs({ page: 2, perPage: 5 })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.equal(response.body().meta.perPage, 5);
    assert.equal(response.body().meta.currentPage, 2);
    assert.lengthOf(response.body().data, 5);
  });

  test('should filter settings by exact group match', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await SettingFactory.merge({ group: 'client-app' }).create();
    await SettingFactory.merge({ group: 'client-admin' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/settings')
      .qs({ group: 'client-app' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 1);
    assert.isTrue(response.body().data.every((setting: any) => setting.group === 'client-app'));
  });

  test('should filter settings by group pattern with wildcard', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await SettingFactory.merge({ group: 'client-app' }).create();
    await SettingFactory.merge({ group: 'client-admin' }).create();
    await SettingFactory.merge({ group: 'other-group' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/settings')
      .qs({ group: '%client%' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((setting: any) => setting.group.includes('client')));
  });

  test('should filter settings by exact key match', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await SettingFactory.merge({ group: 'client-app', key: 'theme' }).create();
    await SettingFactory.merge({ group: 'client-app', key: 'language' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/settings')
      .qs({ key: 'theme' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].key, 'theme');
  });

  test('should filter settings by key pattern with wildcard', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await SettingFactory.merge({ group: 'client-app', key: 'app-theme' }).create();
    await SettingFactory.merge({ group: 'client-app', key: 'app-language' }).create();
    await SettingFactory.merge({ group: 'client-app', key: 'user-name' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/settings')
      .qs({ key: '%app%' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((setting: any) => setting.key.includes('app')));
  });

  test('should combine wildcard filters', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await SettingFactory.merge({ group: 'client-app', key: 'app-theme' }).create();
    await SettingFactory.merge({ group: 'client-admin', key: 'admin-theme' }).create();
    await SettingFactory.merge({ group: 'client-app', key: 'user-setting' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/settings')
      .qs({ group: '%client-app%', key: '%app%' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 1);
    assert.isTrue(response.body().data.every((setting: any) => setting.group === 'client-app'));
    assert.isTrue(response.body().data.every((setting: any) => setting.key.includes('app')));
  });

  test('should return empty data when no settings match filter', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/settings')
      .qs({ key: 'non-existent-key' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 0);
  });

  test('should return all settings without filters', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await SettingFactory.merge({ group: 'client-app' }).createMany(3);
    await SettingFactory.merge({ group: 'client-admin' }).createMany(2);
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/settings').bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 5);
  });

  test('should fail to get settings without authentication', async ({ client }) => {
    const response = await client.get('/v1/settings');

    response.assertStatus(401);
  });

  test('should fail to get settings with invalid page number', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .get('/v1/settings')
      .qs({ page: -1 })
      .bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'page',
          rule: 'positive',
        },
      ],
    });
  });

  test('should fail to get settings with invalid perPage number', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .get('/v1/settings')
      .qs({ perPage: 0 })
      .bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'perPage',
          rule: 'positive',
        },
      ],
    });
  });
});
