import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { CategoryFactory } from '#database/factories/category_factory';
import { PostFactory } from '#database/factories/post_factory';
import User from '#models/user';

test.group('Categories store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should create a new category with valid data', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/categories').bearerToken(token.value!.release()).json({
      uri: 'test-category',
      name: 'Test Category',
      description: 'Test category description',
    });

    response.assertStatus(201);
    response.assertBodyContains({
      uri: 'test-category',
      name: 'Test Category',
      description: 'Test category description',
    });

    assert.properties(response.body(), ['id', 'uri', 'name', 'description', 'createdAt']);
  });

  test('should fail to create category without authentication', async ({ client }) => {
    const response = await client.post('/v1/categories').json({
      uri: 'test-category',
      name: 'Test Category',
      description: 'Test description',
    });

    response.assertStatus(401);
  });

  test('should fail to create category with duplicate uri', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    await CategoryFactory.merge({ uri: 'duplicate-uri' }).create();

    const response = await client.post('/v1/categories').bearerToken(token.value!.release()).json({
      uri: 'duplicate-uri',
      name: 'Another Category',
      description: 'Another description',
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

  test('should fail to create category with missing required fields', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .post('/v1/categories')
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(422);
    response.assertBody({
      errors: [
        {
          field: 'uri',
          message: 'The uri field must be defined',
          rule: 'required',
        },
        {
          field: 'name',
          message: 'The name field must be defined',
          rule: 'required',
        },
        {
          field: 'description',
          message: 'The description field must be defined',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to create category with invalid uri characters', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.post('/v1/categories').bearerToken(token.value!.release()).json({
      uri: 'invalid uri with spaces',
      name: 'Test Category',
      description: 'Test description',
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

  test('should attach categories to a post using categoryIds', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();
    const category1 = await CategoryFactory.create();
    const category2 = await CategoryFactory.create();

    const response = await client
      .post(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryIds: [category1.id, category2.id],
      });

    response.assertStatus(200);
    response.assertBody([category1.id, category2.id]);

    // Verify the relationship was created
    await post.load('categories');
    assert.lengthOf(post.categories, 2);
    assert.includeMembers(
      post.categories.map((c) => c.id),
      [category1.id, category2.id]
    );
  });

  test('should attach categories to a post using categoryUris', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();
    await CategoryFactory.merge({ uri: 'tech' }).create();
    await CategoryFactory.merge({ uri: 'news' }).create();

    const response = await client
      .post(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryUris: ['tech', 'news'],
      });

    response.assertStatus(200);
    response.assertBody(['tech', 'news']);

    // Verify the relationship was created
    await post.load('categories');
    assert.lengthOf(post.categories, 2);
    assert.includeMembers(
      post.categories.map((c) => c.uri),
      ['tech', 'news']
    );
  });

  test('should fail to attach categories to post without categoryIds or categoryUris', async ({
    client,
  }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();

    const response = await client
      .post(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(400);
    response.assertBodyContains({
      message:
        'Field "categoryIds" or "categoryUris" must be provided when attaching categories to a post',
    });
  });

  test('should fail to attach categories to non-existent post', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();

    const response = await client
      .post('/v1/posts/99999/categories')
      .bearerToken(token.value!.release())
      .json({
        categoryIds: [category.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'params.post_id',
          rule: 'database.exists',
        },
      ],
    });
  });

  test('should fail to attach non-existent categories using categoryIds', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();

    const response = await client
      .post(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryIds: [99999, 99998],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'categoryIds.0',
          rule: 'database.exists',
        },
      ],
    });
  });

  test('should fail to attach non-existent categories using categoryUris', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();

    const response = await client
      .post(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryUris: ['non-existent-uri', 'another-fake-uri'],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'categoryUris.0',
          rule: 'database.exists',
        },
      ],
    });
  });

  test('should fail to attach already attached categories using categoryIds', async ({
    client,
  }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();
    const category = await CategoryFactory.create();

    // First attach
    await post.related('categories').attach([category.id]);

    // Try to attach again
    const response = await client
      .post(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryIds: [category.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'categoryIds.0',
          rule: 'database.unique',
        },
      ],
    });
  });

  test('should fail to attach already attached categories using categoryUris', async ({
    client,
  }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();
    const category = await CategoryFactory.merge({ uri: 'already-attached' }).create();

    // First attach
    await post.related('categories').attach([category.id]);

    // Try to attach again
    const response = await client
      .post(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryUris: ['already-attached'],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'categoryUris.0',
          rule: 'database.unique',
        },
      ],
    });
  });
});
