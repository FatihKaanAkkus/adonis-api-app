import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Users update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should update user with valid data', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.merge({
      email: 'old@example.com',
      fullName: 'Old Name',
    }).create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: 'new@example.com',
        fullName: 'New Name',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      id: targetUser.id,
      email: 'new@example.com',
      fullName: 'New Name',
    });

    assert.properties(response.body(), ['id', 'email', 'fullName', 'createdAt', 'profile']);
  });

  test('should update user email only', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.merge({
      email: 'original@example.com',
      fullName: 'Original Name',
    }).create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: 'updated@example.com',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      email: 'updated@example.com',
      fullName: 'Original Name',
    });
  });

  test('should update user password', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: targetUser.email,
        password: 'newpassword123',
      });

    response.assertStatus(200);
    assert.notProperty(response.body(), 'password');
  });

  test('should update user fullName to null', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.merge({
      email: 'test@example.com',
      fullName: 'Test User',
    }).create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: 'test@example.com',
        fullName: null,
      });

    response.assertStatus(200);
    assert.isNull(response.body().fullName);
  });

  test('should update user with profile data', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.with('profile').create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: targetUser.email,
        profile: {
          avatarUri: 'https://example.com/new-avatar.jpg',
          bio: 'Updated bio',
        },
      });

    response.assertStatus(200);
    response.assertBodyContains({
      profile: {
        avatarUri: 'https://example.com/new-avatar.jpg',
        bio: 'Updated bio',
      },
    });
  });

  test('should update user and create profile if none exists', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    // Create user without profile
    const targetUser = await UserFactory.create();
    // Remove profile if it was created by factory
    if (targetUser.profile) {
      await targetUser.profile.delete();
      await targetUser.load('profile');
      assert.isNull(targetUser.profile);
    }

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: targetUser.email,
        profile: {
          avatarUri: 'https://example.com/created-avatar.jpg',
          bio: 'Created profile',
        },
      });

    response.assertStatus(200);
    response.assertBodyContains({
      profile: {
        avatarUri: 'https://example.com/created-avatar.jpg',
        bio: 'Created profile',
      },
    });
    assert.exists(response.body().profile.id);
    assert.equal(response.body().profile.userId, targetUser.id);
  });

  test('should update user profile to null fields', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.with('profile').create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: targetUser.email,
        profile: {
          avatarUri: null,
          bio: null,
        },
      });

    response.assertStatus(200);
    assert.isNull(response.body().profile.avatarUri);
    assert.isNull(response.body().profile.bio);
  });

  test('should fail to update without authentication', async ({ client }) => {
    const targetUser = await UserFactory.create();

    const response = await client.put(`/v1/users/${targetUser.id}`).json({
      email: 'newemail@example.com',
    });

    response.assertStatus(401);
  });

  test('should fail to update with duplicate email', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    await UserFactory.merge({ email: 'existing@example.com' }).create();
    const targetUser = await UserFactory.merge({ email: 'target@example.com' }).create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: 'existing@example.com',
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

  test('should allow updating with same email', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.merge({
      email: 'same@example.com',
      fullName: 'Old Name',
    }).create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: 'same@example.com',
        fullName: 'New Name',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      email: 'same@example.com',
      fullName: 'New Name',
    });
  });

  test('should fail to update with invalid email format', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: 'invalid-email-format',
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

  test('should fail to update with short password', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.create();

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: targetUser.email,
        password: '12345',
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

  test('should fail to update with email exceeding max length', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const targetUser = await UserFactory.create();
    const longEmail = 'a'.repeat(250) + '@example.com';

    const response = await client
      .put(`/v1/users/${targetUser.id}`)
      .bearerToken(token.value!.release())
      .json({
        email: longEmail,
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

  test('should fail to update non-existent user', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.put('/v1/users/99999').bearerToken(token.value!.release()).json({
      email: 'newemail@example.com',
    });

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

    const response = await client
      .put('/v1/users/invalid')
      .bearerToken(token.value!.release())
      .json({
        email: 'test@example.com',
      });

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

    const response = await client.put('/v1/users/-1').bearerToken(token.value!.release()).json({
      email: 'test@example.com',
    });

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
