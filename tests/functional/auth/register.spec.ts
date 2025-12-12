import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';

test.group('Auth register', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should register a new user with valid data', async ({ client, assert }) => {
    const response = await client.post('/v1/auth/register').json({
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
    });

    response.assertStatus(201);
    response.assertBodyContains({
      user: {
        email: 'newuser@example.com',
        fullName: 'New User',
      },
    });

    assert.properties(response.body().user, ['id', 'email', 'fullName', 'createdAt', 'profile']);
    assert.notProperty(response.body().user, 'password');
  });

  test('should register user with profile data', async ({ client }) => {
    const response = await client.post('/v1/auth/register').json({
      email: 'withprofile@example.com',
      password: 'password123',
      fullName: 'Profile User',
      profile: {
        avatarUri: 'https://example.com/avatar.jpg',
        bio: 'This is my bio',
      },
    });

    response.assertStatus(201);
    response.assertBodyContains({
      user: {
        email: 'withprofile@example.com',
        profile: {
          avatarUri: 'https://example.com/avatar.jpg',
          bio: 'This is my bio',
        },
      },
    });
  });

  test('should register user without optional fullName', async ({ client, assert }) => {
    const response = await client.post('/v1/auth/register').json({
      email: 'minimal@example.com',
      password: 'password123',
    });

    response.assertStatus(201);
    response.assertBodyContains({
      user: {
        email: 'minimal@example.com',
      },
    });
    // fullName is omitted because it is undefined from Lucid model
    assert.notProperty(response.body().user, 'fullName');
  });

  test('should register user without optional profile', async ({ client, assert }) => {
    const response = await client.post('/v1/auth/register').json({
      email: 'noprofile@example.com',
      password: 'password123',
      fullName: 'No Profile User',
    });

    response.assertStatus(201);
    assert.properties(response.body().user.profile, ['id', 'userId', 'createdAt']);
  });

  test('should register user with null fullName', async ({ client, assert }) => {
    const response = await client.post('/v1/auth/register').json({
      email: 'nullname@example.com',
      password: 'password123',
      fullName: null,
    });

    response.assertStatus(201);
    assert.isNull(response.body().user.fullName);
  });

  test('should register user with partial profile data', async ({ client, assert }) => {
    const response = await client.post('/v1/auth/register').json({
      email: 'partialprofile@example.com',
      password: 'password123',
      fullName: 'Partial Profile User',
      profile: {
        bio: 'Just a bio, no avatar',
      },
    });

    response.assertStatus(201);
    response.assertBodyContains({
      user: {
        profile: {
          bio: 'Just a bio, no avatar',
        },
      },
    });
    assert.isNull(response.body().user.profile.avatarUri);
  });

  test('should register user with null profile fields', async ({ client, assert }) => {
    const response = await client.post('/v1/auth/register').json({
      email: 'nullprofile@example.com',
      password: 'password123',
      fullName: 'Null Profile User',
      profile: {
        avatarUri: null,
        bio: null,
      },
    });

    response.assertStatus(201);
    assert.isNull(response.body().user.profile.avatarUri);
    assert.isNull(response.body().user.profile.bio);
  });

  test('should fail to register with duplicate email', async ({ client }) => {
    await UserFactory.merge({ email: 'duplicate@example.com' }).create();

    const response = await client.post('/v1/auth/register').json({
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

  test('should fail to register with missing required fields', async ({ client }) => {
    const response = await client.post('/v1/auth/register').json({});

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

  test('should fail to register with invalid email format', async ({ client }) => {
    const response = await client.post('/v1/auth/register').json({
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

  test('should fail to register with short password', async ({ client }) => {
    const response = await client.post('/v1/auth/register').json({
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

  test('should fail to register with missing email', async ({ client }) => {
    const response = await client.post('/v1/auth/register').json({
      password: 'password123',
      fullName: 'No Email User',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'email',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to register with missing password', async ({ client }) => {
    const response = await client.post('/v1/auth/register').json({
      email: 'nopass@example.com',
      fullName: 'No Password User',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'password',
          rule: 'required',
        },
      ],
    });
  });
});
