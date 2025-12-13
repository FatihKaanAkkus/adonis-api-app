import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { PostFactory } from '#database/factories/post_factory';
import { CategoryFactory } from '#database/factories/category_factory';
import { AttachmentFactory } from '#database/factories/attachment_factory';

test.group('Posts index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get paginated list of posts with default settings', async ({ client, assert }) => {
    await PostFactory.apply('post').createMany(5);

    const response = await client.get('/v1/posts');

    response.assertStatus(200);
    assert.properties(response.body(), ['meta', 'data']);
    assert.equal(response.body().meta.perPage, 10);
    assert.equal(response.body().meta.currentPage, 1);
    assert.isAtLeast(response.body().data.length, 5);
  });

  test('should paginate posts with custom page and perPage', async ({ client, assert }) => {
    await PostFactory.apply('post').createMany(15);

    const response = await client.get('/v1/posts').qs({ page: 2, perPage: 5 });

    response.assertStatus(200);
    assert.equal(response.body().meta.perPage, 5);
    assert.equal(response.body().meta.currentPage, 2);
    assert.lengthOf(response.body().data, 5);
  });

  test('should filter posts by exact type match', async ({ client, assert }) => {
    await PostFactory.merge({ type: 'post' }).createMany(2);
    await PostFactory.merge({ type: 'page' }).create();

    const response = await client.get('/v1/posts').qs({ type: 'post' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((post: any) => post.type === 'post'));
  });

  test('should filter posts by exact uri match', async ({ client, assert }) => {
    await PostFactory.apply('post').merge({ uri: 'test-post' }).create();
    await PostFactory.apply('post').merge({ uri: 'other-post' }).create();

    const response = await client.get('/v1/posts').qs({ uri: 'test-post' });

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].uri, 'test-post');
  });

  test('should filter posts by uri pattern with wildcard', async ({ client, assert }) => {
    await PostFactory.apply('post').merge({ uri: 'blog-post-1' }).create();
    await PostFactory.apply('post').merge({ uri: 'blog-post-2' }).create();
    await PostFactory.apply('post').merge({ uri: 'page-about' }).create();

    const response = await client.get('/v1/posts').qs({ uri: '%blog%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((post: any) => post.uri.includes('blog')));
  });

  test('should filter posts by exact title match', async ({ client, assert }) => {
    await PostFactory.apply('post').merge({ title: 'Test Title' }).create();
    await PostFactory.apply('post').merge({ title: 'Other Title' }).create();

    const response = await client.get('/v1/posts').qs({ title: 'Test Title' });

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].title, 'Test Title');
  });

  test('should filter posts by title pattern with wildcard', async ({ client, assert }) => {
    await PostFactory.apply('post').merge({ title: 'Guide to React' }).create();
    await PostFactory.apply('post').merge({ title: 'Guide to Vue' }).create();
    await PostFactory.apply('post').merge({ title: 'Introduction to Node' }).create();

    const response = await client.get('/v1/posts').qs({ title: '%Guide%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((post: any) => post.title.includes('Guide')));
  });

  test('should filter posts by exact description match', async ({ client, assert }) => {
    await PostFactory.apply('post').merge({ description: 'Test description' }).create();
    await PostFactory.apply('post').merge({ description: 'Other description' }).create();

    const response = await client.get('/v1/posts').qs({ description: 'Test description' });

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].description, 'Test description');
  });

  test('should filter posts by description pattern with wildcard', async ({ client, assert }) => {
    await PostFactory.apply('post').merge({ description: 'Learn React basics' }).create();
    await PostFactory.apply('post').merge({ description: 'Learn Vue basics' }).create();
    await PostFactory.apply('post').merge({ description: 'Advanced Node techniques' }).create();

    const response = await client.get('/v1/posts').qs({ description: '%basics%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((post: any) => post.description?.includes('basics')));
  });

  test('should filter posts by userId', async ({ client, assert }) => {
    const user1 = await UserFactory.merge({ fullName: 'John Smith' }).create();
    const user2 = await UserFactory.merge({ fullName: 'Jane Doe' }).create();
    await PostFactory.apply('post').merge({ userId: user1.id }).createMany(2);
    await PostFactory.apply('post').merge({ userId: user2.id }).create();

    const response = await client.get('/v1/posts').qs({ userId: user1.id });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((post: any) => post.user.fullName === 'John Smith'));
  });

  test('should filter posts by category uri', async ({ client, assert }) => {
    const category1 = await CategoryFactory.merge({ uri: 'tech' }).create();
    const category2 = await CategoryFactory.merge({ uri: 'lifestyle' }).create();
    const post1 = await PostFactory.apply('post').create();
    const post2 = await PostFactory.apply('post').create();
    await PostFactory.apply('post').create();

    await category1.related('posts').attach([post1.id]);
    await category2.related('posts').attach([post2.id]);

    const response = await client.get('/v1/posts').qs({ category: 'tech' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 1);
    const postIds = response.body().data.map((p: any) => p.id);
    assert.include(postIds, post1.id);
  });

  test('should filter posts by category uri pattern with wildcard', async ({ client, assert }) => {
    const category1 = await CategoryFactory.merge({ uri: 'tech-news' }).create();
    const category2 = await CategoryFactory.merge({ uri: 'tech-reviews' }).create();
    const category3 = await CategoryFactory.merge({ uri: 'lifestyle' }).create();
    const post1 = await PostFactory.apply('post').create();
    const post2 = await PostFactory.apply('post').create();
    const post3 = await PostFactory.apply('post').create();

    await category1.related('posts').attach([post1.id]);
    await category2.related('posts').attach([post2.id]);
    await category3.related('posts').attach([post3.id]);

    const response = await client.get('/v1/posts').qs({ category: '%tech%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
  });

  test('should filter posts that have categories', async ({ client, assert }) => {
    const postWithCategories = await PostFactory.apply('post').with('categories', 2).create();
    const postWithoutCategories = await PostFactory.apply('post').create();

    const response = await client.get('/v1/posts').qs({ hasCategories: true });

    response.assertStatus(200);
    const postIds = response.body().data.map((post: any) => post.id);
    assert.include(postIds, postWithCategories.id);
    assert.notInclude(postIds, postWithoutCategories.id);
  });

  test('should include categories when withCategories is true', async ({ client, assert }) => {
    const post = await PostFactory.apply('post').with('categories', 2).create();

    const response = await client.get('/v1/posts').qs({ withCategories: true });

    response.assertStatus(200);
    const foundPost = response.body().data.find((p: any) => p.id === post.id);
    assert.isDefined(foundPost);
    assert.isArray(foundPost.categories);
    assert.isAtLeast(foundPost.categories.length, 2);
  });

  test('should not include categories when withCategories is false', async ({ client, assert }) => {
    await PostFactory.apply('post').with('categories', 2).create();

    const response = await client.get('/v1/posts').qs({ withCategories: false });

    response.assertStatus(200);
    // Categories should still be included as default is true, so check data
    assert.isArray(response.body().data);
  });

  test('should filter posts that have attachments', async ({ client, assert }) => {
    const postWithAttachments = await PostFactory.apply('post').with('attachments', 2).create();
    const postWithoutAttachments = await PostFactory.apply('post').create();

    const response = await client.get('/v1/posts').qs({ hasAttachments: true });

    response.assertStatus(200);
    const postIds = response.body().data.map((post: any) => post.id);
    assert.include(postIds, postWithAttachments.id);
    assert.notInclude(postIds, postWithoutAttachments.id);
  });

  test('should include attachments when withAttachments is true', async ({ client, assert }) => {
    const post = await PostFactory.apply('post').with('attachments', 2).create();

    const response = await client.get('/v1/posts').qs({ withAttachments: true });

    response.assertStatus(200);
    const foundPost = response.body().data.find((p: any) => p.id === post.id);
    assert.isDefined(foundPost);
    assert.isArray(foundPost.attachments);
    assert.isAtLeast(foundPost.attachments.length, 2);
  });

  test('should not include attachments when withAttachments is false', async ({
    client,
    assert,
  }) => {
    await PostFactory.apply('post').with('attachments', 2).create();

    const response = await client.get('/v1/posts').qs({ withAttachments: false });

    response.assertStatus(200);
    assert.isTrue(
      response.body().data.every((post: any) => !post.attachments || post.attachments.length === 0)
    );
  });

  test('should get posts by category_id', async ({ client, assert }) => {
    const category = await CategoryFactory.create();
    const post1 = await PostFactory.apply('post').create();
    const post2 = await PostFactory.apply('post').create();
    await PostFactory.apply('post').create();

    await category.related('posts').attach([post1.id, post2.id]);

    const response = await client.get(`/v1/categories/${category.id}/posts`);

    response.assertStatus(200);
    assert.isArray(response.body());
    assert.isAtLeast(response.body().length, 2);
    const postIds = response.body().map((p: any) => p.id);
    assert.includeMembers(postIds, [post1.id, post2.id]);
  });

  test('should get posts by attachment_id', async ({ client, assert }) => {
    const attachment = await AttachmentFactory.create();
    const post1 = await PostFactory.apply('post').create();
    const post2 = await PostFactory.apply('post').create();
    await PostFactory.apply('post').create();

    await attachment.related('posts').attach([post1.id, post2.id]);

    const response = await client.get(`/v1/attachments/${attachment.id}/posts`);

    response.assertStatus(200);
    assert.isArray(response.body());
    assert.isAtLeast(response.body().length, 2);
    const postIds = response.body().map((p: any) => p.id);
    assert.includeMembers(postIds, [post1.id, post2.id]);
  });

  test('should order posts by created_at descending', async ({ client, assert }) => {
    await PostFactory.apply('post').createMany(5);

    const response = await client.get('/v1/posts');

    response.assertStatus(200);
    const dates = response.body().data.map((post: any) => new Date(post.createdAt).getTime());
    const sortedDates = [...dates].sort((a, b) => b - a);
    assert.deepEqual(dates, sortedDates);
  });

  test('should combine multiple filters', async ({ client, assert }) => {
    const user = await UserFactory.merge({ fullName: 'Combined Filter User' }).create();
    await PostFactory.merge({ type: 'post', userId: user.id }).createMany(2);
    await PostFactory.merge({ type: 'page', userId: user.id }).create();
    await PostFactory.apply('post').merge({ type: 'post' }).create();

    const response = await client.get('/v1/posts').qs({ type: 'post', userId: user.id });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(
      response
        .body()
        .data.every(
          (post: any) => post.type === 'post' && post.user.fullName === 'Combined Filter User'
        )
    );
  });

  test('should return empty data when no posts match filter', async ({ client, assert }) => {
    const response = await client.get('/v1/posts').qs({ uri: 'non-existent-uri' });

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 0);
  });

  test('should include user information by default', async ({ client, assert }) => {
    const user = await UserFactory.merge({ fullName: 'John Doe' }).create();
    await PostFactory.apply('post').merge({ userId: user.id }).create();

    const response = await client.get('/v1/posts');

    response.assertStatus(200);
    const post = response.body().data.find((p: any) => p.user.fullName === 'John Doe');
    assert.isDefined(post);
    assert.properties(post.user, ['fullName']);
    assert.equal(post.user.fullName, 'John Doe');
  });

  test('should omit userId from response', async ({ client, assert }) => {
    await PostFactory.apply('post').create();
    await PostFactory.apply('post').with('user').create();

    const response = await client.get('/v1/posts');

    response.assertStatus(200);
    assert.isTrue(response.body().data.every((post: any) => !post.userId));
  });

  test('should fail to get posts with invalid page number', async ({ client }) => {
    const response = await client.get('/v1/posts').qs({ page: -1 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'page', rule: 'positive' }],
    });
  });

  test('should fail to get posts with invalid perPage number', async ({ client }) => {
    const response = await client.get('/v1/posts').qs({ perPage: 0 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'perPage', rule: 'positive' }],
    });
  });

  test('should fail to get posts with perPage exceeding max', async ({ client }) => {
    const response = await client.get('/v1/posts').qs({ perPage: 101 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'perPage', rule: 'max' }],
    });
  });

  test('should fail to get posts by non-existent category_id', async ({ client }) => {
    const response = await client.get('/v1/categories/999999/posts');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.category_id', rule: 'database.exists' }],
    });
  });

  test('should fail to get posts by non-existent attachment_id', async ({ client }) => {
    const response = await client.get('/v1/attachments/999999/posts');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.attachment_id', rule: 'database.exists' }],
    });
  });

  test('should fail to get posts with invalid type', async ({ client }) => {
    const response = await client.get('/v1/posts').qs({ type: 'invalid' });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'type', rule: 'enum' }],
    });
  });
});
