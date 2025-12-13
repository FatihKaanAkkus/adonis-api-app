import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { CategoryFactory } from '#database/factories/category_factory';
import { PostFactory } from '#database/factories/post_factory';

test.group('Categories index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get paginated list of categories with default settings', async ({
    client,
    assert,
  }) => {
    await CategoryFactory.createMany(5);

    const response = await client.get('/v1/categories');

    response.assertStatus(200);
    assert.properties(response.body(), ['meta', 'data']);
    assert.equal(response.body().meta.perPage, 10);
    assert.equal(response.body().meta.currentPage, 1);
    assert.isAtLeast(response.body().data.length, 5);
  });

  test('should paginate categories with custom page and perPage', async ({ client, assert }) => {
    await CategoryFactory.createMany(15);

    const response = await client.get('/v1/categories').qs({ page: 2, perPage: 5 });

    response.assertStatus(200);
    assert.equal(response.body().meta.perPage, 5);
    assert.equal(response.body().meta.currentPage, 2);
    assert.lengthOf(response.body().data, 5);
  });

  test('should filter categories by exact uri match', async ({ client, assert }) => {
    await CategoryFactory.merge({ uri: 'test-category' }).create();
    await CategoryFactory.merge({ uri: 'other-category' }).create();

    const response = await client.get('/v1/categories').qs({ uri: 'test-category' });

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].uri, 'test-category');
  });

  test('should filter categories by uri pattern with wildcard', async ({ client, assert }) => {
    await CategoryFactory.merge({ uri: 'tech-news' }).create();
    await CategoryFactory.merge({ uri: 'tech-reviews' }).create();
    await CategoryFactory.merge({ uri: 'lifestyle' }).create();

    const response = await client.get('/v1/categories').qs({ uri: '%tech%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((cat: any) => cat.uri.includes('tech')));
  });

  test('should filter categories by exact name match', async ({ client, assert }) => {
    await CategoryFactory.merge({ name: 'Technology' }).create();
    await CategoryFactory.merge({ name: 'Lifestyle' }).create();

    const response = await client.get('/v1/categories').qs({ name: 'Technology' });

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].name, 'Technology');
  });

  test('should filter categories by name pattern with wildcard', async ({ client, assert }) => {
    await CategoryFactory.merge({ name: 'Tech News' }).create();
    await CategoryFactory.merge({ name: 'Tech Reviews' }).create();
    await CategoryFactory.merge({ name: 'Food Recipes' }).create();

    const response = await client.get('/v1/categories').qs({ name: '%Tech%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((cat: any) => cat.name.includes('Tech')));
  });

  test('should filter categories that have posts', async ({ client, assert }) => {
    const categoryWithPosts = await CategoryFactory.with('posts', 2).create();
    const categoryWithoutPosts = await CategoryFactory.create();

    const response = await client.get('/v1/categories').qs({ hasPosts: true });

    response.assertStatus(200);
    const categoryIds = response.body().data.map((cat: any) => cat.id);
    assert.include(categoryIds, categoryWithPosts.id);
    assert.notInclude(categoryIds, categoryWithoutPosts.id);
  });

  test('should include posts when withPosts is true', async ({ client, assert }) => {
    const category = await CategoryFactory.with('posts', 2).create();

    const response = await client.get('/v1/categories').qs({ withPosts: true });

    response.assertStatus(200);
    const foundCategory = response.body().data.find((c: any) => c.id === category.id);
    assert.isDefined(foundCategory);
    assert.isArray(foundCategory.posts);
    assert.isAtLeast(foundCategory.posts.length, 2);
  });

  test('should not include posts when withPosts is false', async ({ client, assert }) => {
    await CategoryFactory.with('posts', 2).create();

    const response = await client.get('/v1/categories').qs({ withPosts: false });

    response.assertStatus(200);
    assert.isTrue(response.body().data.every((cat: any) => !cat.posts || cat.posts.length === 0));
  });

  test('should get categories by post_id', async ({ client, assert }) => {
    const post = await PostFactory.create();
    const category1 = await CategoryFactory.create();
    const category2 = await CategoryFactory.create();
    await CategoryFactory.create();

    await post.related('categories').attach([category1.id, category2.id]);

    const response = await client.get(`/v1/posts/${post.id}/categories`);

    response.assertStatus(200);
    assert.isArray(response.body());
    assert.isAtLeast(response.body().length, 2);
    const categoryIds = response.body().map((c: any) => c.id);
    assert.includeMembers(categoryIds, [category1.id, category2.id]);
  });

  test('should order categories by created_at descending', async ({ client, assert }) => {
    await CategoryFactory.createMany(5);

    const response = await client.get('/v1/categories');

    response.assertStatus(200);
    const dates = response.body().data.map((cat: any) => new Date(cat.createdAt).getTime());
    const sortedDates = [...dates].sort((a, b) => b - a);
    assert.deepEqual(dates, sortedDates);
  });

  test('should combine multiple filters', async ({ client, assert }) => {
    await CategoryFactory.merge({ name: 'Tech News', uri: 'tech-news' }).create();
    await CategoryFactory.merge({ name: 'Tech Reviews', uri: 'tech-reviews' }).create();
    await CategoryFactory.merge({ name: 'Food', uri: 'food' }).create();

    const response = await client.get('/v1/categories').qs({ name: '%Tech%', uri: '%tech%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(
      response
        .body()
        .data.every((cat: any) => cat.name.includes('Tech') && cat.uri.includes('tech'))
    );
  });

  test('should return empty data when no categories match filter', async ({ client, assert }) => {
    const response = await client.get('/v1/categories').qs({ uri: 'non-existent-uri' });

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 0);
  });

  test('should fail to get categories with invalid page number', async ({ client }) => {
    const response = await client.get('/v1/categories').qs({ page: -1 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'page', rule: 'positive' }],
    });
  });

  test('should fail to get categories with invalid perPage number', async ({ client }) => {
    const response = await client.get('/v1/categories').qs({ perPage: 0 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'perPage', rule: 'positive' }],
    });
  });

  test('should fail to get categories with perPage exceeding max', async ({ client }) => {
    const response = await client.get('/v1/categories').qs({ perPage: 101 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'perPage', rule: 'max' }],
    });
  });

  test('should fail to get categories by non-existent post_id', async ({ client }) => {
    const response = await client.get('/v1/posts/999999/categories');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.post_id', rule: 'database.exists' }],
    });
  });
});
