import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Auth login', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should login with valid credentials', async ({ client, assert }) => {
    await UserFactory.merge({ email: 'test@example.com', password: 'password123' }).create();

    const response = await client.post('/v1/auth/login').json({
      email: 'test@example.com',
      password: 'password123',
    });

    response.assertStatus(200);
    response.assertBodyContains({
      user: {
        email: 'test@example.com',
      },
    });

    assert.properties(response.body(), ['user', 'token']);
    assert.properties(response.body().user, ['id', 'email', 'profile', 'createdAt']);
    assert.notProperty(response.body().user, 'password');
  });

  test('should return token with proper structure', async ({ client, assert }) => {
    await UserFactory.merge({ email: 'token@example.com', password: 'password123' }).create();

    const response = await client.post('/v1/auth/login').json({
      email: 'token@example.com',
      password: 'password123',
    });

    response.assertStatus(200);
    assert.properties(response.body().token, ['type', 'name', 'token', 'abilities', 'expiresAt']);
    assert.equal(response.body().token.type, 'bearer');
    assert.isString(response.body().token.token);
  });

  test('should return user with profile', async ({ client, assert }) => {
    await UserFactory.with('profile')
      .merge({ email: 'profile@example.com', password: 'password123' })
      .create();

    const response = await client.post('/v1/auth/login').json({
      email: 'profile@example.com',
      password: 'password123',
    });

    response.assertStatus(200);
    assert.properties(response.body().user.profile, ['id', 'userId', 'createdAt']);
  });

  test('should login via web session when X-Client-Type is web', async ({ client, assert }) => {
    await UserFactory.merge({ email: 'web@example.com', password: 'password123' }).create();

    const response = await client.post('/v1/auth/login').header('X-Client-Type', 'web').json({
      email: 'web@example.com',
      password: 'password123',
    });

    response.assertStatus(200);
    response.assertBodyContains({
      user: {
        email: 'web@example.com',
      },
    });

    assert.property(response.body(), 'user');
    assert.notProperty(response.body(), 'token');
    assert.properties(response.body().user, ['id', 'email', 'profile', 'createdAt']);

    // Check if session cookies are set
    response.assertCookie('adonis-session');
    assert.isTrue(Object.values(response.cookies()).length >= 2);
  });

  test('should delete old tokens and create only one token per user', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.merge({
      email: 'onetoken@example.com',
      password: 'password123',
    }).create();

    // First login - creates first token
    const firstLogin = await client.post('/v1/auth/login').json({
      email: 'onetoken@example.com',
      password: 'password123',
    });

    const firstToken = firstLogin.body().token.token;

    // Second login - should delete first token and create new one
    const secondLogin = await client.post('/v1/auth/login').json({
      email: 'onetoken@example.com',
      password: 'password123',
    });

    const secondToken = secondLogin.body().token.token;

    assert.notEqual(firstToken, secondToken);

    // Verify only one token exists
    const tokens = await User.accessTokens.all(user);
    assert.lengthOf(tokens, 1);
  });

  test('should fail to login with invalid password', async ({ client }) => {
    await UserFactory.merge({
      email: 'wrongpass@example.com',
      password: 'correctpassword',
    }).create();

    const response = await client.post('/v1/auth/login').json({
      email: 'wrongpass@example.com',
      password: 'wrongpassword',
    });

    response.assertStatus(401);
    response.assertBody({ message: 'Invalid credentials' });
  });

  test('should fail to login with non-existent email', async ({ client }) => {
    const response = await client.post('/v1/auth/login').json({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    response.assertStatus(401);
    response.assertBody({ message: 'Invalid credentials' });
  });

  test('should fail to login with missing email', async ({ client }) => {
    const response = await client.post('/v1/auth/login').json({
      password: 'password123',
    });

    response.assertStatus(401);
    response.assertBody({ message: 'Invalid credentials' });
  });

  test('should fail to login with missing password', async ({ client }) => {
    const response = await client.post('/v1/auth/login').json({
      email: 'test@example.com',
    });

    response.assertStatus(401);
    response.assertBody({ message: 'Invalid credentials' });
  });

  test('should fail to login with missing both fields', async ({ client }) => {
    const response = await client.post('/v1/auth/login').json({});

    response.assertStatus(401);
    response.assertBody({ message: 'Invalid credentials' });
  });

  test('should fail to login with invalid email format', async ({ client }) => {
    const response = await client.post('/v1/auth/login').json({
      email: 'invalid-email-format',
      password: 'password123',
    });

    response.assertStatus(401);
    response.assertBodyContains({ message: 'Invalid credentials' });
  });

  test('should fail to login with short password', async ({ client }) => {
    const response = await client.post('/v1/auth/login').json({
      email: 'test@example.com',
      password: '12345',
    });

    response.assertStatus(401);
    response.assertBodyContains({ message: 'Invalid credentials' });
  });

  test('should fail to login with empty email', async ({ client }) => {
    const response = await client.post('/v1/auth/login').json({
      email: '',
      password: 'password123',
    });

    response.assertStatus(401);
    response.assertBodyContains({ message: 'Invalid credentials' });
  });

  test('should fail to login with empty password', async ({ client }) => {
    const response = await client.post('/v1/auth/login').json({
      email: 'test@example.com',
      password: '',
    });

    response.assertStatus(401);
    response.assertBodyContains({ message: 'Invalid credentials' });
  });

  test('should fail to login via web with invalid password', async ({ client, assert }) => {
    await UserFactory.merge({
      email: 'webfail@example.com',
      password: 'correctpassword',
    }).create();

    const response = await client.post('/v1/auth/login').header('X-Client-Type', 'web').json({
      email: 'webfail@example.com',
      password: 'wrongpassword',
    });

    response.assertStatus(401);
    response.assertBody({ message: 'Invalid credentials' });
    assert.notProperty(response.body(), 'user');
  });
});
