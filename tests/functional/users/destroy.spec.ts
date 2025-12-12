import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Users destroy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should delete user with valid id', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const userToDelete = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/users/${userToDelete.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'User deleted',
    });

    // Verify user is deleted
    const deletedUser = await User.find(userToDelete.id);
    assert.isNull(deletedUser);
  });

  test('should delete user with profile', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const userToDelete = await UserFactory.with('profile').create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/users/${userToDelete.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'User deleted',
    });

    // Verify user is deleted
    const deletedUser = await User.find(userToDelete.id);
    assert.isNull(deletedUser);
  });

  test('should delete user and cascade delete their access tokens', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const userToDelete = await UserFactory.create();
    const authToken = await User.accessTokens.create(authenticatedUser);

    // Create token for user to be deleted
    const userToken = await User.accessTokens.create(userToDelete);
    const tokenId = userToken.identifier;

    const response = await client
      .delete(`/v1/users/${userToDelete.id}`)
      .bearerToken(authToken.value!.release());

    response.assertStatus(200);

    // Verify user is deleted
    const deletedUser = await User.find(userToDelete.id);
    assert.isNull(deletedUser);

    // Verify their token is also deleted
    const tokenExists = await User.accessTokens.find(userToDelete, tokenId);
    assert.isNull(tokenExists);
  });

  test('should allow user to delete themselves', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete(`/v1/users/${user.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'User deleted',
    });

    // Verify user is deleted
    const deletedUser = await User.find(user.id);
    assert.isNull(deletedUser);
  });

  test('should fail to delete user without authentication', async ({ client }) => {
    const response = await client.delete('/v1/users/1');

    response.assertStatus(401);
  });

  test('should fail to delete non-existent user', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.delete('/v1/users/999999').bearerToken(token.value!.release());

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

  test('should fail to delete user with non-numeric id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.delete('/v1/users/abc').bearerToken(token.value!.release());

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

  test('should fail to delete user with negative id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.delete('/v1/users/-1').bearerToken(token.value!.release());

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

  test('should fail to delete user with decimal id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.delete('/v1/users/1.5').bearerToken(token.value!.release());

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
});
