import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Auth session', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should return authenticated user with api token', async ({ client, assert }) => {
    const user = await UserFactory.with('profile').create();
    const token = await User.accessTokens.create(user);

    const response = await client.get('/v1/auth/session').bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });

    assert.properties(response.body().user, ['id', 'email', 'profile', 'createdAt']);
    assert.properties(response.body().user.profile, ['id', 'userId', 'createdAt']);
    assert.notProperty(response.body().user, 'password');
  });

  test('should return authenticated user with web session', async ({ client, assert }) => {
    const user = await UserFactory.with('profile')
      .merge({ email: 'websession@example.com', password: 'password123' })
      .create();

    // Login to establish session
    const loginResponse = await client
      .post('/v1/auth/login')
      .header('X-Client-Type', 'web')
      .json({ email: 'websession@example.com', password: 'password123' });

    const cookieHeader = loginResponse.headers()['set-cookie'];

    // Use session to access protected endpoint
    const response = await client.get('/v1/auth/session').header('cookie', cookieHeader);

    response.assertStatus(200);
    response.assertBodyContains({
      user: {
        id: user.id,
        email: user.email,
      },
    });

    assert.properties(response.body().user, ['id', 'email', 'profile', 'createdAt']);
    assert.notProperty(response.body().user, 'password');
  });

  test('should fail without authentication', async ({ client }) => {
    const response = await client.get('/v1/auth/session');

    response.assertStatus(401);
  });

  test('should fail with invalid token', async ({ client }) => {
    const response = await client.get('/v1/auth/session').bearerToken('invalid-token-12345');

    response.assertStatus(401);
  });

  test('should fail with expired or revoked token', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const tokenValue = token.value!.release();

    // Revoke the token
    await User.accessTokens.delete(user, token.identifier);

    const response = await client.get('/v1/auth/session').bearerToken(tokenValue);

    response.assertStatus(401);
  });
});
