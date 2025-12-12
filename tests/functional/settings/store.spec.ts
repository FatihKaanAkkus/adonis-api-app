import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { SettingFactory } from '#database/factories/setting_factory';
import User from '#models/user';

test.group('Settings store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should create a new setting with valid data', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-theme',
      key: 'primary-color',
      value: '#3498db',
    });

    response.assertStatus(201);
    response.assertBodyContains({
      group: 'client-theme',
      key: 'primary-color',
      value: '#3498db',
    });

    assert.properties(response.body(), ['id', 'group', 'key', 'value', 'createdAt']);
  });

  test('should create setting with default group client when not provided', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      key: 'app-name',
      value: 'My Application',
    });

    response.assertStatus(201);
    response.assertBodyContains({
      group: 'client',
      key: 'app-name',
      value: 'My Application',
    });
  });

  test('should create setting with null value', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-feature',
      key: 'optional-setting',
      value: null,
    });

    response.assertStatus(201);
    assert.isNull(response.body().value);
  });

  test('should fail to create setting without authentication', async ({ client }) => {
    const response = await client.post('/v1/settings').json({
      group: 'client-test',
      key: 'test-key',
      value: 'test-value',
    });

    response.assertStatus(401);
  });

  test('should fail to create setting with duplicate key', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    await SettingFactory.merge({ group: 'client-test', key: 'duplicate-key' }).create();

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-test',
      key: 'duplicate-key',
      value: 'another value',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'key',
          rule: 'database.unique',
        },
      ],
    });
  });

  test('should fail to create setting with missing required key', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-test',
      value: 'some value',
    });

    response.assertStatus(422);
    response.assertBody({
      errors: [
        {
          field: 'key',
          message: 'The key field must be defined',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to create setting with missing required value', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-test',
      key: 'test-key',
    });

    response.assertStatus(422);
    response.assertBody({
      errors: [
        {
          field: 'value',
          message: 'The value field must be defined',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to create setting with group not starting with client-', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'admin-settings',
      key: 'admin-key',
      value: 'admin value',
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

  test('should fail to create setting with invalid key characters', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-test',
      key: 'invalid key with spaces',
      value: 'test value',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'key',
          rule: 'alphaNumeric',
        },
      ],
    });
  });

  test('should fail to create setting with invalid group characters', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-invalid group!',
      key: 'test-key',
      value: 'test value',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'group',
          rule: 'alphaNumeric',
        },
      ],
    });
  });

  test('should create setting with valid special characters in key', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-ui',
      key: 'button_style-primary',
      value: 'rounded',
    });

    response.assertStatus(201);
    assert.equal(response.body().key, 'button_style-primary');
  });

  test('should create setting with valid special characters in group', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/settings').bearerToken(token.value!.release()).json({
      group: 'client-feature_flag',
      key: 'dark-mode',
      value: 'enabled',
    });

    response.assertStatus(201);
    assert.equal(response.body().group, 'client-feature_flag');
  });
});
