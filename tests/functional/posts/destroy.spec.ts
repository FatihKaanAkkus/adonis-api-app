import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { PostFactory } from '#database/factories/post_factory';
import { CategoryFactory } from '#database/factories/category_factory';
import { AttachmentFactory } from '#database/factories/attachment_factory';
import User from '#models/user';
import Post from '#models/post';

test.group('Posts destroy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should delete post with valid id', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'Post deleted',
    });

    // Verify post is deleted
    const deletedPost = await Post.find(post.id);
    assert.isNull(deletedPost);
  });

  test('should delete post with categories', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.with('categories', 2).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'Post deleted',
    });

    // Verify post is deleted
    const deletedPost = await Post.find(post.id);
    assert.isNull(deletedPost);
  });

  test('should delete post with attachments', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.with('attachments', 2).create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/posts/${post.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'Post deleted',
    });

    // Verify post is deleted
    const deletedPost = await Post.find(post.id);
    assert.isNull(deletedPost);
  });

  test('should detach posts from category', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const category = await CategoryFactory.create();
    const posts = await PostFactory.createMany(3);
    const token = await User.accessTokens.create(authenticatedUser);

    // Attach posts to category
    await category.related('posts').attach(posts.map((p) => p.id));

    const response = await client
      .delete(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [posts[0].id, posts[1].id],
      });

    response.assertStatus(200);
    response.assertBodyContains([posts[0].id, posts[1].id]);

    // Verify posts are detached
    await category.load('posts');
    assert.lengthOf(category.posts, 1);
    assert.equal(category.posts[0].id, posts[2].id);
  });

  test('should detach all specified posts from category', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const category = await CategoryFactory.create();
    const posts = await PostFactory.createMany(2);
    const token = await User.accessTokens.create(authenticatedUser);

    // Attach posts to category
    await category.related('posts').attach(posts.map((p) => p.id));

    const response = await client
      .delete(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: posts.map((p) => p.id),
      });

    response.assertStatus(200);

    // Verify all posts are detached
    await category.load('posts');
    assert.lengthOf(category.posts, 0);
  });

  test('should detach posts from attachment', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const attachment = await AttachmentFactory.create();
    const posts = await PostFactory.createMany(3);
    const token = await User.accessTokens.create(authenticatedUser);

    // Attach posts to attachment
    await attachment.related('posts').attach(posts.map((p) => p.id));

    const response = await client
      .delete(`/v1/attachments/${attachment.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [posts[0].id, posts[1].id],
      });

    response.assertStatus(200);
    response.assertBodyContains([posts[0].id, posts[1].id]);

    // Verify posts are detached
    await attachment.load('posts');
    assert.lengthOf(attachment.posts, 1);
    assert.equal(attachment.posts[0].id, posts[2].id);
  });

  test('should detach all specified posts from attachment', async ({ client, assert }) => {
    const authenticatedUser = await UserFactory.create();
    const attachment = await AttachmentFactory.create();
    const posts = await PostFactory.createMany(2);
    const token = await User.accessTokens.create(authenticatedUser);

    // Attach posts to attachment
    await attachment.related('posts').attach(posts.map((p) => p.id));

    const response = await client
      .delete(`/v1/attachments/${attachment.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: posts.map((p) => p.id),
      });

    response.assertStatus(200);

    // Verify all posts are detached
    await attachment.load('posts');
    assert.lengthOf(attachment.posts, 0);
  });

  test('should fail to delete post without authentication', async ({ client }) => {
    const post = await PostFactory.create();

    const response = await client.delete(`/v1/posts/${post.id}`);

    response.assertStatus(401);
  });

  test('should fail to delete non-existent post', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.delete('/v1/posts/999999').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'database.exists' }],
    });
  });

  test('should fail to delete post with negative id', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.delete('/v1/posts/-1').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'positive' }],
    });
  });

  test('should fail to delete post with decimal id', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client.delete('/v1/posts/1.5').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'withoutDecimals' }],
    });
  });

  test('should fail to detach posts from category without postIds', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const category = await CategoryFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'postIds', rule: 'required' }],
    });
  });

  test('should fail to detach posts from attachment without postIds', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const attachment = await AttachmentFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/attachments/${attachment.id}/posts`)
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'postIds', rule: 'required' }],
    });
  });

  test('should fail to detach posts from non-existent category', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete('/v1/categories/999999/posts')
      .bearerToken(token.value!.release())
      .json({
        postIds: [post.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.category_id', rule: 'database.exists' }],
    });
  });

  test('should fail to detach posts from non-existent attachment', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete('/v1/attachments/999999/posts')
      .bearerToken(token.value!.release())
      .json({
        postIds: [post.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.attachment_id', rule: 'database.exists' }],
    });
  });

  test('should fail to detach non-existent posts from category', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const category = await CategoryFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [999999],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'postIds.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach non-existent posts from attachment', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const attachment = await AttachmentFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/attachments/${attachment.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [999999],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'postIds.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach posts not attached to category', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const category = await CategoryFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [post.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'postIds.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach posts not attached to attachment', async ({ client }) => {
    const authenticatedUser = await UserFactory.create();
    const attachment = await AttachmentFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(authenticatedUser);

    const response = await client
      .delete(`/v1/attachments/${attachment.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [post.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'postIds.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach posts from category without authentication', async ({ client }) => {
    const category = await CategoryFactory.create();
    const post = await PostFactory.create();

    const response = await client.delete(`/v1/categories/${category.id}/posts`).json({
      postIds: [post.id],
    });

    response.assertStatus(401);
  });

  test('should fail to detach posts from attachment without authentication', async ({ client }) => {
    const attachment = await AttachmentFactory.create();
    const post = await PostFactory.create();

    const response = await client.delete(`/v1/attachments/${attachment.id}/posts`).json({
      postIds: [post.id],
    });

    response.assertStatus(401);
  });
});
