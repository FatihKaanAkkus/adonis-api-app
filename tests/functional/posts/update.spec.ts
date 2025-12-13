import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { PostFactory } from '#database/factories/post_factory';
import User from '#models/user';

test.group('Posts update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should update post title', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ title: 'Old Title' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        title: 'New Title',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      id: post.id,
      title: 'New Title',
    });

    await post.refresh();
    assert.equal(post.title, 'New Title');
  });

  test('should update post uri', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ uri: 'old-uri' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'new-uri',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      id: post.id,
      uri: 'new-uri',
    });

    await post.refresh();
    assert.equal(post.uri, 'new-uri');
  });

  test('should update post type', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ type: 'post' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        type: 'page',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      id: post.id,
      type: 'page',
    });

    await post.refresh();
    assert.equal(post.type, 'page');
  });

  test('should update post description', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ description: 'Old description' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        description: 'New description',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      description: 'New description',
    });

    await post.refresh();
    assert.equal(post.description, 'New description');
  });

  test('should update post description to null', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ description: 'Old description' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        description: null,
      });

    response.assertStatus(200);

    await post.refresh();
    assert.isNull(post.description);
  });

  test('should update post content', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ content: 'Old content' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        content: 'New content',
      });

    response.assertStatus(200);

    await post.refresh();
    assert.equal(post.content, 'New content');
  });

  test('should update post coverImage', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ coverImage: 'old-image.jpg' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        coverImage: 'new-image.jpg',
      });

    response.assertStatus(200);

    await post.refresh();
    assert.equal(post.coverImage, 'new-image.jpg');
  });

  test('should update post coverImage to null', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ coverImage: 'old-image.jpg' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        coverImage: null,
      });

    response.assertStatus(200);

    await post.refresh();
    assert.isNull(post.coverImage);
  });

  test('should update post userId', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const oldAuthor = await UserFactory.create();
    const newAuthor = await UserFactory.create();
    const post = await PostFactory.merge({ userId: oldAuthor.id }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        userId: newAuthor.id,
      });

    response.assertStatus(200);

    await post.refresh();
    assert.equal(post.userId, newAuthor.id);
  });

  test('should update post userId to null', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const author = await UserFactory.create();
    const post = await PostFactory.merge({ userId: author.id }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        userId: null,
      });

    response.assertStatus(200);

    await post.refresh();
    assert.isNull(post.userId);
  });

  test('should update multiple fields at once', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({
      title: 'Old Title',
      description: 'Old description',
      type: 'post',
    }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        title: 'New Title',
        description: 'New description',
        type: 'page',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      title: 'New Title',
      description: 'New description',
      type: 'page',
    });

    await post.refresh();
    assert.equal(post.title, 'New Title');
    assert.equal(post.description, 'New description');
    assert.equal(post.type, 'page');
  });

  test('should fail to update post without authentication', async ({ client }) => {
    const post = await PostFactory.create();

    const response = await client.put(`/v1/posts/${post.id}`).json({
      uri: post.uri,
      title: 'New Title',
    });

    response.assertStatus(401);
  });

  test('should fail to update non-existent post', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.put('/v1/posts/999999').bearerToken(token.value!.release()).json({
      uri: 'new-uri',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'database.exists' }],
    });
  });

  test('should fail to update post with missing required uri', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        title: 'New Title',
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'uri', rule: 'required' }],
    });
  });

  test('should fail to update post with duplicate uri', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    await PostFactory.merge({ uri: 'existing-uri' }).create();
    const post = await PostFactory.merge({ uri: 'my-uri' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'existing-uri',
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'uri', rule: 'database.unique' }],
    });
  });

  test('should allow updating post with same uri', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.merge({ uri: 'my-uri', title: 'Old Title' }).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'my-uri',
        title: 'New Title',
      });

    response.assertStatus(200);

    await post.refresh();
    assert.equal(post.uri, 'my-uri');
    assert.equal(post.title, 'New Title');
  });

  test('should fail to update post with invalid type', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: post.uri,
        type: 'invalid',
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'type', rule: 'enum' }],
    });
  });

  test('should fail to update post with non-alphanumeric uri', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .put(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'invalid uri!',
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'uri', rule: 'alphaNumeric' }],
    });
  });

  test('should fail to update post with negative id', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.put('/v1/posts/-1').bearerToken(token.value!.release()).json({
      uri: 'test-uri',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'positive' }],
    });
  });

  test('should fail to update post with decimal id', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.put('/v1/posts/1.5').bearerToken(token.value!.release()).json({
      uri: 'test-uri',
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'withoutDecimals' }],
    });
  });
});
