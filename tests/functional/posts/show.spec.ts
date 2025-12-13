import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { PostFactory } from '#database/factories/post_factory';

test.group('Posts show', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get post by id', async ({ client, assert }) => {
    const post = await PostFactory.with('categories', 2).create();

    const response = await client.get(`/v1/posts/${post.id}`);

    response.assertStatus(200);
    response.assertBodyContains({
      id: post.id,
      title: post.title,
      uri: post.uri,
    });
    assert.properties(response.body(), ['id', 'title', 'uri', 'user', 'categories']);
    assert.notProperty(response.body(), 'userId');
    assert.isArray(response.body().categories);
    assert.isAtLeast(response.body().categories.length, 2);
  });

  test('should get post by uri', async ({ client, assert }) => {
    const post = await PostFactory.merge({ uri: 'test-post-uri' }).with('categories', 1).create();

    const response = await client.get(`/v1/posts/${post.uri}`);

    response.assertStatus(200);
    response.assertBodyContains({
      id: post.id,
      title: post.title,
      uri: 'test-post-uri',
    });
    assert.properties(response.body(), ['id', 'title', 'uri', 'user', 'categories']);
    assert.notProperty(response.body(), 'userId');
  });

  test('should get post by uri with attachments', async ({ client, assert }) => {
    const post = await PostFactory.merge({ uri: 'post-with-attachments' })
      .with('attachments', 2)
      .create();

    const response = await client.get(`/v1/posts/${post.uri}`).qs({ withAttachments: true });

    response.assertStatus(200);
    response.assertBodyContains({
      uri: 'post-with-attachments',
    });
    assert.properties(response.body(), ['id', 'attachments']);
    assert.isArray(response.body().attachments);
    assert.lengthOf(response.body().attachments, 2);
  });

  test('should get post with attachments when withAttachments is true', async ({
    client,
    assert,
  }) => {
    const post = await PostFactory.with('attachments', 2).create();

    const response = await client.get(`/v1/posts/${post.id}`).qs({ withAttachments: true });

    response.assertStatus(200);
    assert.properties(response.body(), ['id', 'attachments']);
    assert.isArray(response.body().attachments);
    assert.isAtLeast(response.body().attachments.length, 2);
  });

  test('should get post without attachments when withAttachments is false', async ({
    client,
    assert,
  }) => {
    const post = await PostFactory.with('attachments', 2).create();

    const response = await client.get(`/v1/posts/${post.id}`).qs({ withAttachments: false });

    response.assertStatus(200);
    assert.notProperty(response.body(), 'attachments');
  });

  test('should get post without attachments by default', async ({ client, assert }) => {
    const post = await PostFactory.with('attachments', 2).create();

    const response = await client.get(`/v1/posts/${post.id}`);

    response.assertStatus(200);
    assert.notProperty(response.body(), 'attachments');
  });

  test('should include user information', async ({ client, assert }) => {
    const author = await UserFactory.merge({ fullName: 'John Doe' }).create();
    const post = await PostFactory.merge({ userId: author.id }).create();

    const response = await client.get(`/v1/posts/${post.id}`);

    response.assertStatus(200);
    assert.properties(response.body().user, ['fullName']);
    assert.equal(response.body().user.fullName, 'John Doe');
  });

  test('should include categories information', async ({ client, assert }) => {
    const post = await PostFactory.with('categories', 2).create();

    const response = await client.get(`/v1/posts/${post.id}`);

    response.assertStatus(200);
    assert.isArray(response.body().categories);
    assert.properties(response.body().categories[0], ['name', 'uri']);
  });

  test('should fail to get non-existent post by id', async ({ client }) => {
    const response = await client.get('/v1/posts/999999');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'id', rule: 'database.exists' }],
    });
  });

  test('should fail to get non-existent post by uri', async ({ client }) => {
    const response = await client.get('/v1/posts/non-existent-uri');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'uri', rule: 'database.exists' }],
    });
  });

  test('should fail to get post with negative id', async ({ client }) => {
    const response = await client.get('/v1/posts/-1');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'id', rule: 'positive' }],
    });
  });

  test('should fail to get post with decimal id', async ({ client }) => {
    const response = await client.get('/v1/posts/1.5');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'id', rule: 'withoutDecimals' }],
    });
  });
});
