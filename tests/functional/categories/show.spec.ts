import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { CategoryFactory } from '#database/factories/category_factory';

test.group('Categories show', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get category by id', async ({ client, assert }) => {
    const category = await CategoryFactory.create();

    const response = await client.get(`/v1/categories/${category.id}`);

    response.assertStatus(200);
    response.assertBodyContains({
      id: category.id,
      name: category.name,
      uri: category.uri,
    });
    assert.properties(response.body(), ['id', 'name', 'uri', 'createdAt', 'updatedAt']);
  });

  test('should get category with posts', async ({ client, assert }) => {
    const category = await CategoryFactory.with('posts', 3).create();

    const response = await client.get(`/v1/categories/${category.id}`);

    response.assertStatus(200);
    assert.properties(response.body(), ['id', 'name', 'uri', 'posts']);
    assert.isArray(response.body().posts);
    assert.lengthOf(response.body().posts, 3);
  });

  test('should get category without posts when no posts attached', async ({ client, assert }) => {
    const category = await CategoryFactory.create();

    const response = await client.get(`/v1/categories/${category.id}`);

    response.assertStatus(200);
    assert.properties(response.body(), ['id', 'name', 'uri', 'posts']);
    assert.isArray(response.body().posts);
    assert.lengthOf(response.body().posts, 0);
  });

  test('should fail to get category with non-existent id', async ({ client }) => {
    const response = await client.get('/v1/categories/999999');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'database.exists' }],
    });
  });

  test('should fail to get category with negative id', async ({ client }) => {
    const response = await client.get('/v1/categories/-1');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'positive' }],
    });
  });

  test('should fail to get category with decimal id', async ({ client }) => {
    const response = await client.get('/v1/categories/1.5');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'withoutDecimals' }],
    });
  });

  test('should fail to get category with invalid id', async ({ client }) => {
    const response = await client.get('/v1/categories/invalid');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id' }],
    });
  });
});
