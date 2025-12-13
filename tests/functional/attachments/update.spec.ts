import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';
import { AttachmentFactory } from '#database/factories/attachment_factory';
import { UserFactory } from '#database/factories/user_factory';
import User from '#models/user';

test.group('Attachments update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should update attachment with all fields', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.merge({ path: 'uploads-old.jpg' }).create();

    const response = await client
      .put(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-new.jpg',
        ext: 'jpg',
        size: 2048,
        title: 'Updated Title',
      });

    response.assertStatus(200);
    assert.properties(response.body(), ['id', 'path', 'ext', 'size', 'title']);
    assert.equal(response.body().path, 'uploads-new.jpg');
    assert.equal(response.body().ext, 'jpg');
    assert.equal(response.body().size, 2048);
    assert.equal(response.body().title, 'Updated Title');
  });

  test('should update attachment with only path', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.merge({
      path: 'uploads-original.jpg',
      ext: 'jpg',
      size: 1024,
      title: 'Original Title',
    }).create();

    const response = await client
      .put(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-updated.jpg',
      });

    response.assertStatus(200);
    assert.equal(response.body().path, 'uploads-updated.jpg');
    assert.equal(response.body().ext, 'jpg');
    assert.equal(response.body().size, 1024);
    assert.equal(response.body().title, 'Original Title');
  });

  test('should update attachment with path and title', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.merge({
      path: 'uploads-test.jpg',
      title: 'Old Title',
    }).create();

    const response = await client
      .put(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-modified.jpg',
        title: 'New Title',
      });

    response.assertStatus(200);
    assert.equal(response.body().path, 'uploads-modified.jpg');
    assert.equal(response.body().title, 'New Title');
  });

  test('should fail to update attachment without authentication', async ({ client }) => {
    const attachment = await AttachmentFactory.create();

    const response = await client.put(`/v1/attachments/${attachment.id}`).json({
      path: 'uploads-new.jpg',
    });

    response.assertStatus(401);
  });

  test('should fail to update attachment with invalid id format', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .put('/v1/attachments/invalid')
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-new.jpg',
      });

    response.assertStatus(422);
  });

  test('should fail to update attachment with negative id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .put('/v1/attachments/-1')
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-new.jpg',
      });

    response.assertStatus(422);
  });

  test('should fail to update attachment with decimal id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .put('/v1/attachments/1.5')
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-new.jpg',
      });

    response.assertStatus(422);
  });

  test('should fail to update non-existent attachment', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .put('/v1/attachments/999999')
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-new.jpg',
      });

    response.assertStatus(422);
  });

  test('should fail to update attachment without path', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();

    const response = await client
      .put(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release())
      .json({
        title: 'New Title',
      });

    response.assertStatus(422);
  });

  test('should fail to update attachment with duplicate path', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    await AttachmentFactory.merge({ path: 'uploads-existing.jpg' }).create();
    const attachment = await AttachmentFactory.merge({ path: 'uploads-original.jpg' }).create();

    const response = await client
      .put(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-existing.jpg',
      });

    response.assertStatus(422);
  });

  test('should update attachment with same path', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.merge({
      path: 'uploads-keep.jpg',
      title: 'Old Title',
    }).create();

    const response = await client
      .put(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-keep.jpg',
        title: 'New Title',
      });

    response.assertStatus(200);
    assert.equal(response.body().path, 'uploads-keep.jpg');
    assert.equal(response.body().title, 'New Title');
  });

  test('should fail to update attachment with negative size', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();

    const response = await client
      .put(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-test.jpg',
        size: -1,
      });

    response.assertStatus(422);
  });

  test('should fail to update attachment with decimal size', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();

    const response = await client
      .put(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release())
      .json({
        path: 'uploads-test.jpg',
        size: 1024.5,
      });

    response.assertStatus(422);
  });
});
