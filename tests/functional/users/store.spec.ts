import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Users store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should create a new user with valid data', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
    });

    response.assertStatus(201);
    response.assertBodyContains({
      email: 'newuser@example.com',
      fullName: 'New User',
    });

    assert.properties(response.body(), ['id', 'email', 'fullName', 'createdAt', 'profile']);
    assert.notProperty(response.body(), 'password');
  });

  test('should create user with profile data', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .post('/v1/users')
      .bearerToken(token.value!.release())
      .json({
        email: 'userprofile@example.com',
        password: 'password123',
        fullName: 'User With Profile',
        profile: {
          avatarUri: 'https://example.com/avatar.jpg',
          bio: 'This is my bio',
        },
      });

    response.assertStatus(201);
    response.assertBodyContains({
      email: 'userprofile@example.com',
      profile: {
        avatarUri: 'https://example.com/avatar.jpg',
        bio: 'This is my bio',
      },
    });
  });

  test('should create user without optional fullName', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({
      email: 'minimal@example.com',
      password: 'password123',
    });

    response.assertStatus(201);
    response.assertBodyContains({
      email: 'minimal@example.com',
    });
    // fullName is omitted because it is undefined from Lucid model
    assert.notProperty(response.body(), 'fullName');
  });

  test('should create user without optional profile', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({
      email: 'noprofile@example.com',
      password: 'password123',
      fullName: 'No Profile User',
    });

    response.assertStatus(201);
    assert.properties(response.body().profile, ['id', 'userId', 'createdAt']);
  });

  test('should fail to create user without authentication', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    await User.accessTokens.create(authenticatedUser);

    const response = await client.post('/v1/users').json({
      email: 'noauth@example.com',
      password: 'password123',
      fullName: 'No Auth User',
    });

    response.assertStatus(401);
  });

  test('should fail to create user with duplicate email', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);
    await UserFactory.merge({ email: 'duplicate@example.com' }).create();

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({
      email: 'duplicate@example.com',
      password: 'password123',
      fullName: 'Duplicate User',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'email',
          rule: 'database.unique',
        },
      ],
    });
  });

  test('should fail to create user with missing required fields', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({});

    response.assertStatus(422);
    response.assertBody({
      errors: [
        {
          field: 'email',
          message: 'The email field must be defined',
          rule: 'required',
        },
        {
          field: 'password',
          message: 'The password field must be defined',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to create user with invalid email format', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({
      email: 'invalid-email-format',
      password: 'password123',
      fullName: 'Invalid Email User',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'email',
          rule: 'email',
        },
      ],
    });
  });

  test('should fail to create user with short password', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({
      email: 'shortpass@example.com',
      password: '12345',
      fullName: 'Short Password User',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'password',
          rule: 'minLength',
        },
      ],
    });
  });

  test('should fail to create user with email exceeding max length', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);
    const longEmail = 'a'.repeat(250) + '@example.com';

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({
      email: longEmail,
      password: 'password123',
      fullName: 'Long Email User',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'email',
          rule: 'maxLength',
        },
      ],
    });
  });

  test('should create user with null fullName', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.post('/v1/users').bearerToken(token.value!.release()).json({
      email: 'nullname@example.com',
      password: 'password123',
      fullName: null,
    });

    response.assertStatus(201);
    assert.isNull(response.body().fullName);
  });

  test('should create user with partial profile data', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .post('/v1/users')
      .bearerToken(token.value!.release())
      .json({
        email: 'partialprofile@example.com',
        password: 'password123',
        fullName: 'Partial Profile User',
        profile: {
          bio: 'Just a bio, no avatar',
        },
      });

    response.assertStatus(201);
    response.assertBodyContains({
      profile: {
        bio: 'Just a bio, no avatar',
      },
    });
    assert.isNull(response.body().profile.avatarUri);
  });

  test('should create user with null profile fields', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .post('/v1/users')
      .bearerToken(token.value!.release())
      .json({
        email: 'nullprofile@example.com',
        password: 'password123',
        fullName: 'Null Profile User',
        profile: {
          avatarUri: null,
          bio: null,
        },
      });

    response.assertStatus(201);
    assert.isNull(response.body().profile.avatarUri);
    assert.isNull(response.body().profile.bio);
  });
});
