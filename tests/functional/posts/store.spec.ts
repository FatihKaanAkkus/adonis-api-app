import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { PostFactory } from '#database/factories/post_factory';
import { CategoryFactory } from '#database/factories/category_factory';
import { AttachmentFactory } from '#database/factories/attachment_factory';
import User from '#models/user';

test.group('Posts store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should create a new post with valid data', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/posts').bearerToken(token.value!.release()).json({
      type: 'post',
      uri: 'test-post-uri',
      title: 'Test Post Title',
      description: 'Test post description',
      content: 'Test post content goes here',
      coverImage: 'https://example.com/image.jpg',
      userId: user.id,
    });

    response.assertStatus(201);
    response.assertBodyContains({
      type: 'post',
      uri: 'test-post-uri',
      title: 'Test Post Title',
      description: 'Test post description',
      content: 'Test post content goes here',
      coverImage: 'https://example.com/image.jpg',
    });

    assert.properties(response.body(), ['id', 'type', 'uri', 'title', 'content', 'createdAt']);
  });

  test('should create a new page with valid data', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/posts').bearerToken(token.value!.release()).json({
      type: 'page',
      uri: 'about-us',
      title: 'About Us',
      description: 'About our company',
      content: 'We are a great company',
      coverImage: 'https://example.com/image.jpg',
      userId: user.id,
    });

    response.assertStatus(201);
    response.assertBodyContains({
      type: 'page',
      uri: 'about-us',
      title: 'About Us',
      description: 'About our company',
      content: 'We are a great company',
      coverImage: 'https://example.com/image.jpg',
    });
  });

  test('should fail to create post without authentication', async ({ client }) => {
    const response = await client.post('/v1/posts').json({
      type: 'post',
      uri: 'test-uri',
      title: 'Test Title',
      content: 'Test content',
      description: 'Description here',
      coverImage: 'https://example.com/image.jpg',
      userId: 1,
    });

    response.assertStatus(401);
  });

  test('should fail to create post with duplicate uri', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    await PostFactory.merge({ uri: 'duplicate-uri' }).create();

    const response = await client.post('/v1/posts').bearerToken(token.value!.release()).json({
      type: 'post',
      uri: 'duplicate-uri',
      title: 'Another Post',
      content: 'Content here',
      description: 'Description here',
      coverImage: 'https://example.com/image.jpg',
      userId: user.id,
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'uri',
          rule: 'database.unique',
        },
      ],
    });
  });

  test('should fail to create post with missing required fields', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/posts').bearerToken(token.value!.release()).json({
      type: 'post',
      // Missing uri, title, content, description, coverImage
    });

    response.assertStatus(422);
    response.assertBody({
      errors: [
        {
          field: 'uri',
          message: 'The uri field must be defined',
          rule: 'required',
        },
        {
          field: 'title',
          message: 'The title field must be defined',
          rule: 'required',
        },
        {
          field: 'description',
          message: 'The description field must be defined',
          rule: 'required',
        },
        {
          field: 'content',
          message: 'The content field must be defined',
          rule: 'required',
        },
        {
          field: 'coverImage',
          message: 'The coverImage field must be defined',
          rule: 'required',
        },
        {
          field: 'userId',
          message: 'The userId field must be defined',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to create post with invalid type', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/posts').bearerToken(token.value!.release()).json({
      type: 'invalid-type',
      uri: 'test-uri',
      title: 'Test Title',
      content: 'Test content',
      description: 'Description here',
      coverImage: 'https://example.com/image.jpg',
      userId: user.id,
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'type',
          rule: 'enum',
        },
      ],
    });
  });

  test('should fail to create post with invalid uri characters', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/posts').bearerToken(token.value!.release()).json({
      type: 'post',
      uri: 'invalid uri with spaces',
      title: 'Test Title',
      content: 'Test content',
      description: 'Description here',
      coverImage: 'https://example.com/image.jpg',
      userId: user.id,
    });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'uri',
          rule: 'alphaNumeric',
        },
      ],
    });
  });

  test('should attach existing posts to a category', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();
    const post1 = await PostFactory.create();
    const post2 = await PostFactory.create();

    const response = await client
      .post(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [post1.id, post2.id],
      });

    response.assertStatus(200);
    response.assertBody([post1.id, post2.id]);

    // Verify the relationship was created
    await category.load('posts');
    assert.lengthOf(category.posts, 2);
    assert.includeMembers(
      category.posts.map((p) => p.id),
      [post1.id, post2.id]
    );
  });

  test('should fail to attach posts to category without postIds', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();

    const response = await client
      .post(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'postIds',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to attach posts to non-existent category', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();

    const response = await client
      .post('/v1/categories/99999/posts')
      .bearerToken(token.value!.release())
      .json({
        postIds: [post.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'params.category_id',
          rule: 'database.exists',
        },
      ],
    });
  });

  test('should fail to attach non-existent posts to category', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();

    const response = await client
      .post(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [99999, 99998],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'postIds.0',
          rule: 'database.exists',
        },
      ],
    });
  });

  test('should fail to attach already attached posts to category', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();
    const post = await PostFactory.create();

    // First attach
    await category.related('posts').attach([post.id]);

    // Try to attach again
    const response = await client
      .post(`/v1/categories/${category.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [post.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'postIds.0',
          rule: 'database.unique',
        },
      ],
    });
  });

  test('should attach existing posts to an attachment', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();
    const post1 = await PostFactory.create();
    const post2 = await PostFactory.create();

    const response = await client
      .post(`/v1/attachments/${attachment.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [post1.id, post2.id],
      });

    response.assertStatus(200);
    response.assertBody([post1.id, post2.id]);

    // Verify the relationship was created
    await attachment.load('posts');
    assert.lengthOf(attachment.posts, 2);
    assert.includeMembers(
      attachment.posts.map((p) => p.id),
      [post1.id, post2.id]
    );
  });

  test('should fail to attach posts to attachment without postIds', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();

    const response = await client
      .post(`/v1/attachments/${attachment.id}/posts`)
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'postIds',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to attach posts to non-existent attachment', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();

    const response = await client
      .post('/v1/attachments/99999/posts')
      .bearerToken(token.value!.release())
      .json({
        postIds: [post.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'params.attachment_id',
          rule: 'database.exists',
        },
      ],
    });
  });

  test('should fail to attach already attached posts to attachment', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();
    const post = await PostFactory.create();

    // First attach
    await attachment.related('posts').attach([post.id]);

    // Try to attach again
    const response = await client
      .post(`/v1/attachments/${attachment.id}/posts`)
      .bearerToken(token.value!.release())
      .json({
        postIds: [post.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'postIds.0',
          rule: 'database.unique',
        },
      ],
    });
  });
});
