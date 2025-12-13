import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { CategoryFactory } from '#database/factories/category_factory';
import { PostFactory } from '#database/factories/post_factory';
import User from '#models/user';
import Category from '#models/category';

test.group('Categories destroy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should delete category with valid id', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const category = await CategoryFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'Category deleted',
    });

    const deletedCategory = await Category.find(category.id);
    assert.isNull(deletedCategory);
  });

  test('should delete category with posts', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const category = await CategoryFactory.with('posts', 2).create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    response.assertBodyContains({
      message: 'Category deleted',
    });

    const deletedCategory = await Category.find(category.id);
    assert.isNull(deletedCategory);
  });

  test('should detach categories from post by IDs', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const categories = await CategoryFactory.createMany(3);
    const token = await User.accessTokens.create(user);

    await post.related('categories').attach(categories.map((c) => c.id));

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryIds: [categories[0].id, categories[1].id],
      });

    response.assertStatus(200);
    response.assertBodyContains([categories[0].id, categories[1].id]);

    await post.load('categories');
    assert.lengthOf(post.categories, 1);
    assert.equal(post.categories[0].id, categories[2].id);
  });

  test('should detach all specified categories from post by IDs', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const categories = await CategoryFactory.createMany(2);
    const token = await User.accessTokens.create(user);

    await post.related('categories').attach(categories.map((c) => c.id));

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryIds: categories.map((c) => c.id),
      });

    response.assertStatus(200);

    await post.load('categories');
    assert.lengthOf(post.categories, 0);
  });

  test('should detach categories from post by URIs', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const categories = await CategoryFactory.createMany(3);
    const token = await User.accessTokens.create(user);

    await post.related('categories').attach(categories.map((c) => c.id));

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryUris: [categories[0].uri, categories[1].uri],
      });

    response.assertStatus(200);
    response.assertBodyContains([categories[0].uri, categories[1].uri]);

    await post.load('categories');
    assert.lengthOf(post.categories, 1);
    assert.equal(post.categories[0].id, categories[2].id);
  });

  test('should detach all specified categories from post by URIs', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const categories = await CategoryFactory.createMany(2);
    const token = await User.accessTokens.create(user);

    await post.related('categories').attach(categories.map((c) => c.id));

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryUris: categories.map((c) => c.uri),
      });

    response.assertStatus(200);

    await post.load('categories');
    assert.lengthOf(post.categories, 0);
  });

  test('should fail to delete category without authentication', async ({ client }) => {
    const category = await CategoryFactory.create();

    const response = await client.delete(`/v1/categories/${category.id}`);

    response.assertStatus(401);
  });

  test('should fail to delete non-existent category', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete('/v1/categories/999999')
      .bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'database.exists' }],
    });
  });

  test('should fail to delete category with negative id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.delete('/v1/categories/-1').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'positive' }],
    });
  });

  test('should fail to delete category with decimal id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.delete('/v1/categories/1.5').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'withoutDecimals' }],
    });
  });

  test('should fail to detach categories from post without categoryIds or categoryUris', async ({
    client,
  }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(400);
    response.assertBodyContains({
      message:
        'Field "categoryIds" or "categoryUris" must be provided when detaching categories from a post',
    });
  });

  test('should fail to detach categories from non-existent post', async ({ client }) => {
    const user = await UserFactory.create();
    const category = await CategoryFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete('/v1/posts/999999/categories')
      .bearerToken(token.value!.release())
      .json({
        categoryIds: [category.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.post_id', rule: 'database.exists' }],
    });
  });

  test('should fail to detach non-existent categories from post by IDs', async ({ client }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryIds: [999999],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'categoryIds.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach non-existent categories from post by URIs', async ({ client }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryUris: ['non-existent-uri'],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'categoryUris.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach categories not attached to post by IDs', async ({ client }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const category = await CategoryFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryIds: [category.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'categoryIds.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach categories not attached to post by URIs', async ({ client }) => {
    const user = await UserFactory.create();
    const post = await PostFactory.create();
    const category = await CategoryFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete(`/v1/posts/${post.id}/categories`)
      .bearerToken(token.value!.release())
      .json({
        categoryUris: [category.uri],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'categoryUris.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach categories from post without authentication', async ({ client }) => {
    const post = await PostFactory.create();
    const category = await CategoryFactory.create();

    const response = await client.delete(`/v1/posts/${post.id}/categories`).json({
      categoryIds: [category.id],
    });

    response.assertStatus(401);
  });
});
