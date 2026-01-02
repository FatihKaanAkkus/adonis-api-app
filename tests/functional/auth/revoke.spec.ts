import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Auth revoke', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should revoke api access token', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const tokenValue = token.value!.release();

    const response = await client.post('/v1/auth/revoke').bearerToken(tokenValue);

    response.assertStatus(200);
    response.assertBody({ message: 'Access token revoked successfully' });

    // Verify token is deleted
    const tokens = await User.accessTokens.all(user);
    assert.lengthOf(tokens, 0);
  });

  test('should revoke web session', async ({ client }) => {
    await UserFactory.merge({
      email: 'webrevoke@example.com',
      password: 'password123',
    }).create();

    // Login to establish session
    const loginResponse = await client.post('/v1/auth/login').header('X-Client-Type', 'web').json({
      email: 'webrevoke@example.com',
      password: 'password123',
    });

    const cookieHeader = loginResponse.headers()['set-cookie'];

    // Revoke the session
    const response = await client.post('/v1/auth/revoke').header('cookie', cookieHeader);

    response.assertStatus(200);
    response.assertBody({ message: 'Session revoked successfully' });

    const revokeHeader = response.headers()['set-cookie'];

    // Verify session is invalid - try to access protected endpoint with old cookies
    const sessionCheck = await client.get('/v1/auth/session').header('cookie', revokeHeader);
    sessionCheck.assertStatus(401);
  });

  test('should fail to revoke without authentication', async ({ client }) => {
    const response = await client.post('/v1/auth/revoke');

    response.assertStatus(401);
  });

  test('should fail to revoke with invalid token', async ({ client }) => {
    const response = await client.post('/v1/auth/revoke').bearerToken('invalid-token-12345');

    response.assertStatus(401);
  });

  test('should fail to revoke already revoked token', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const tokenValue = token.value!.release();

    // Revoke the token
    await User.accessTokens.delete(user, token.identifier);

    // Try to revoke again with the same token
    const response = await client.post('/v1/auth/revoke').bearerToken(tokenValue);

    response.assertStatus(401);
  });
});
