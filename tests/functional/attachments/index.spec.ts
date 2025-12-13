import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { AttachmentFactory } from '#database/factories/attachment_factory';
import { PostFactory } from '#database/factories/post_factory';

test.group('Attachments index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get paginated list of attachments with default settings', async ({
    client,
    assert,
  }) => {
    await AttachmentFactory.createMany(5);

    const response = await client.get('/v1/attachments');

    response.assertStatus(200);
    assert.properties(response.body(), ['meta', 'data']);
    assert.equal(response.body().meta.perPage, 10);
    assert.equal(response.body().meta.currentPage, 1);
    assert.isAtLeast(response.body().data.length, 5);
  });

  test('should paginate attachments with custom page and perPage', async ({ client, assert }) => {
    await AttachmentFactory.createMany(15);

    const response = await client.get('/v1/attachments').qs({ page: 2, perPage: 5 });

    response.assertStatus(200);
    assert.equal(response.body().meta.perPage, 5);
    assert.equal(response.body().meta.currentPage, 2);
    assert.lengthOf(response.body().data, 5);
  });

  test('should filter attachments by exact ext match', async ({ client, assert }) => {
    await AttachmentFactory.merge({ ext: 'jpg' }).create();
    await AttachmentFactory.merge({ ext: 'png' }).create();

    const response = await client.get('/v1/attachments').qs({ ext: 'jpg' });

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].ext, 'jpg');
  });

  test('should filter attachments by ext pattern with wildcard', async ({ client, assert }) => {
    await AttachmentFactory.merge({ ext: 'jpg' }).create();
    await AttachmentFactory.merge({ ext: 'jpeg' }).create();
    await AttachmentFactory.merge({ ext: 'png' }).create();

    const response = await client.get('/v1/attachments').qs({ ext: '%jp%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((att: any) => att.ext.includes('jp')));
  });

  test('should filter attachments by exact path match', async ({ client, assert }) => {
    const attachment1 = await AttachmentFactory.merge({ path: 'uploads-test.jpg' }).create();
    await AttachmentFactory.merge({ path: 'uploads-other.jpg' }).create();

    const response = await client.get('/v1/attachments').qs({ path: 'uploads-test.jpg' });

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].id, attachment1.id);
  });

  test('should filter attachments by path pattern with wildcard', async ({ client, assert }) => {
    await AttachmentFactory.merge({ path: 'uploads-images-photo1.jpg' }).create();
    await AttachmentFactory.merge({ path: 'uploads-images-photo2.jpg' }).create();
    await AttachmentFactory.merge({ path: 'uploads-docs-file.pdf' }).create();

    const response = await client.get('/v1/attachments').qs({ path: '%images%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((att: any) => att.path.includes('images')));
  });

  test('should filter attachments by exact title match', async ({ client, assert }) => {
    await AttachmentFactory.merge({ title: 'Profile Picture' }).create();
    await AttachmentFactory.merge({ title: 'Cover Photo' }).create();

    const response = await client.get('/v1/attachments').qs({ title: 'Profile Picture' });

    response.assertStatus(200);
    assert.equal(response.body().data.length, 1);
    assert.equal(response.body().data[0].title, 'Profile Picture');
  });

  test('should filter attachments by title pattern with wildcard', async ({ client, assert }) => {
    await AttachmentFactory.merge({ title: 'Photo 1' }).create();
    await AttachmentFactory.merge({ title: 'Photo 2' }).create();
    await AttachmentFactory.merge({ title: 'Document' }).create();

    const response = await client.get('/v1/attachments').qs({ title: '%Photo%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(response.body().data.every((att: any) => att.title.includes('Photo')));
  });

  test('should filter attachments that have posts', async ({ client, assert }) => {
    const attachmentWithPosts = await AttachmentFactory.with('posts', 2).create();
    const attachmentWithoutPosts = await AttachmentFactory.create();

    const response = await client.get('/v1/attachments').qs({ hasPosts: true });

    response.assertStatus(200);
    const attachmentIds = response.body().data.map((att: any) => att.id);
    assert.include(attachmentIds, attachmentWithPosts.id);
    assert.notInclude(attachmentIds, attachmentWithoutPosts.id);
  });

  test('should include posts when withPosts is true', async ({ client, assert }) => {
    const attachment = await AttachmentFactory.with('posts', 2).create();

    const response = await client.get('/v1/attachments').qs({ withPosts: true });

    response.assertStatus(200);
    const foundAttachment = response.body().data.find((a: any) => a.id === attachment.id);
    assert.isDefined(foundAttachment);
    assert.isArray(foundAttachment.posts);
    assert.isAtLeast(foundAttachment.posts.length, 2);
  });

  test('should not include posts when withPosts is false', async ({ client, assert }) => {
    await AttachmentFactory.with('posts', 2).create();

    const response = await client.get('/v1/attachments').qs({ withPosts: false });

    response.assertStatus(200);
    assert.isTrue(response.body().data.every((att: any) => !att.posts || att.posts.length === 0));
  });

  test('should get attachments by post_id', async ({ client, assert }) => {
    const post = await PostFactory.create();
    const attachment1 = await AttachmentFactory.create();
    const attachment2 = await AttachmentFactory.create();
    await AttachmentFactory.create();

    await post.related('attachments').attach([attachment1.id, attachment2.id]);

    const response = await client.get(`/v1/posts/${post.id}/attachments`);

    response.assertStatus(200);
    assert.isArray(response.body());
    assert.isAtLeast(response.body().length, 2);
    const attachmentIds = response.body().map((a: any) => a.id);
    assert.includeMembers(attachmentIds, [attachment1.id, attachment2.id]);
  });

  test('should order attachments by created_at descending', async ({ client, assert }) => {
    await AttachmentFactory.createMany(5);

    const response = await client.get('/v1/attachments');

    response.assertStatus(200);
    const dates = response.body().data.map((att: any) => new Date(att.createdAt).getTime());
    const sortedDates = [...dates].sort((a, b) => b - a);
    assert.deepEqual(dates, sortedDates);
  });

  test('should combine multiple filters', async ({ client, assert }) => {
    await AttachmentFactory.merge({ ext: 'jpg', title: 'Photo 1' }).create();
    await AttachmentFactory.merge({ ext: 'jpg', title: 'Photo 2' }).create();
    await AttachmentFactory.merge({ ext: 'png', title: 'Image' }).create();

    const response = await client.get('/v1/attachments').qs({ ext: 'jpg', title: '%Photo%' });

    response.assertStatus(200);
    assert.isAtLeast(response.body().data.length, 2);
    assert.isTrue(
      response.body().data.every((att: any) => att.ext === 'jpg' && att.title.includes('Photo'))
    );
  });

  test('should return empty data when no attachments match filter', async ({ client, assert }) => {
    const response = await client.get('/v1/attachments').qs({ path: 'non-existent-path' });

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 0);
  });

  test('should fail to get attachments with invalid page number', async ({ client }) => {
    const response = await client.get('/v1/attachments').qs({ page: -1 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'page', rule: 'positive' }],
    });
  });

  test('should fail to get attachments with invalid perPage number', async ({ client }) => {
    const response = await client.get('/v1/attachments').qs({ perPage: 0 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'perPage', rule: 'positive' }],
    });
  });

  test('should fail to get attachments with perPage exceeding max', async ({ client }) => {
    const response = await client.get('/v1/attachments').qs({ perPage: 101 });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'perPage', rule: 'max' }],
    });
  });

  test('should fail to get attachments by non-existent post_id', async ({ client }) => {
    const response = await client.get('/v1/posts/999999/attachments');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.post_id', rule: 'database.exists' }],
    });
  });
});
