import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Users show', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get a user by id', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.merge({
      email: 'target@example.com',
      fullName: 'Target User',
    }).create();

    const response = await client
      .get(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      id: targetUser.id,
      email: 'target@example.com',
      fullName: 'Target User',
    });

    assert.properties(response.body(), ['id', 'email', 'fullName', 'createdAt', 'profile']);
    assert.notProperty(response.body(), 'password');
  });

  test('should return user with profile', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.with('profile', 1, (profile) =>
      profile.merge({
        avatarUri: 'https://example.com/avatar.jpg',
        bio: 'User bio',
      })
    ).create();

    const response = await client
      .get(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      profile: {
        avatarUri: 'https://example.com/avatar.jpg',
        bio: 'User bio',
      },
    });

    assert.properties(response.body().profile, ['id', 'userId', 'createdAt']);
  });

  test('should return user with null fullName', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.merge({
      email: 'null@example.com',
      fullName: null,
    }).create();

    const response = await client
      .get(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.isNull(response.body().fullName);
  });

  test('should fail to get user without authentication', async ({ client }) => {
    const targetUser = await UserFactory.create();

    const response = await client.get(`/v1/users/${targetUser.id}`);

    response.assertStatus(401);
  });

  test('should fail to get non-existent user', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/users/99999').bearerToken(token.value!.release());

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

  test('should fail with invalid id format', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/users/invalid').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'params.id',
          rule: 'number',
        },
      ],
    });
  });

  test('should fail with negative id', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/users/-1').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'params.id',
          rule: 'positive',
        },
      ],
    });
  });

  test('should fail with decimal id', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/users/1.5').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'params.id',
          rule: 'withoutDecimals',
        },
      ],
    });
  });

  test('should fail with zero id', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/users/0').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'params.id',
          rule: 'positive',
        },
      ],
    });
  });
});
