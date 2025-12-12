import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Users index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get paginated list of users with default settings', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await UserFactory.createMany(5);
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/users').bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.properties(response.body(), ['meta', 'data']);
    assert.equal(response.body().meta.perPage, 10);
    assert.equal(response.body().meta.currentPage, 1);
    assert.isAtLeast(response.body().data.length, 5);
  });

  test('should paginate users with custom page and perPage', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await UserFactory.createMany(15);
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ page: 2, perPage: 5 })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.equal(response.body().meta.perPage, 5);
    assert.equal(response.body().meta.currentPage, 2);
    assert.lengthOf(response.body().data, 5);
  });

  test('should filter users by exact email match', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await UserFactory.merge({ email: 'test@example.com' }).create();
    await UserFactory.merge({ email: 'other@example.com' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ email: 'test@example.com' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].email, 'test@example.com');
  });

  test('should filter users by email pattern with wildcard', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await UserFactory.merge({ email: 'alice@example.com' }).create();
    await UserFactory.merge({ email: 'bob@example.com' }).create();
    await UserFactory.merge({ email: 'charlie@test.com' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ email: '%@example.com' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((user: any) => user.email.includes('@example.com')));
  });

  test('should filter users by exact fullName match', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await UserFactory.merge({ fullName: 'John Doe' }).create();
    await UserFactory.merge({ fullName: 'Jane Smith' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ fullName: 'John Doe' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].fullName, 'John Doe');
  });

  test('should filter users by fullName pattern with wildcard', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await UserFactory.merge({ fullName: 'John Doe' }).create();
    await UserFactory.merge({ fullName: 'John Smith' }).create();
    await UserFactory.merge({ fullName: 'Jane Doe' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ fullName: '%John%' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((user: any) => user.fullName?.includes('John')));
  });

  test('should filter users who have posts', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const userWithPosts = await UserFactory.with('posts', 2).create();
    const userWithoutPosts = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ hasPosts: true })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    const userIds = response.body().data.map((user: any) => user.id);
    assert.include(userIds, userWithPosts.id);
    assert.notInclude(userIds, userWithoutPosts.id);
  });

  test('should include posts when withPosts is true', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const userWithPosts = await UserFactory.with('posts', 2).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ withPosts: true })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    const user = response.body().data.find((u: any) => u.id === userWithPosts.id);
    assert.isDefined(user);
    assert.isArray(user.posts);
    assert.isAtLeast(user.posts.length, 2);
  });

  test('should include posts with categories when withPosts is true', async ({
    client,
    assert,
  }) => {
    const authenticatedUser = await UserFactory.create();
    const userWithPosts = await UserFactory.with('posts', 1, (post) =>
      post.with('categories', 2)
    ).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ withPosts: true })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    const user = response.body().data.find((u: any) => u.id === userWithPosts.id);
    assert.isDefined(user);
    assert.isArray(user.posts);
    assert.isAtLeast(user.posts.length, 1);
    assert.isArray(user.posts[0].categories);
    assert.isAtLeast(user.posts[0].categories.length, 2);
  });

  test('should order users by email ascending', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    await UserFactory.merge({ email: 'charlie@example.com' }).create();
    await UserFactory.merge({ email: 'alice@example.com' }).create();
    await UserFactory.merge({ email: 'bob@example.com' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.get('/v1/users').bearerToken(token.value!.release());

    response.assertStatus(200);
    const emails = response.body().data.map((user: any) => user.email);
    const sortedEmails = [...emails].sort();
    assert.deepEqual(emails, sortedEmails);
  });

  test('should combine email filter and hasPosts filter', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const userWithPosts = await UserFactory.merge({ email: 'test@example.com' })
      .with('posts', 1)
      .create();
    await UserFactory.merge({ email: 'other@example.com' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ email: 'test@example.com', hasPosts: true })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].id, userWithPosts.id);
  });

  test('should return empty data when no users match filter', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .get('/v1/users')
      .qs({ email: 'nonexistent@example.com' })
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 0);
  });

  test('should fail to get users without authentication', async ({ client }) => {
    const response = await client.get('/v1/users');

    response.assertStatus(401);
  });

  test('should fail to get users with invalid page number', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .get('/v1/users')
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

  test('should fail to get users with invalid perPage number', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .get('/v1/users')
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
