import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { AttachmentFactory } from '#database/factories/attachment_factory';

test.group('Attachments show', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should get attachment by id', async ({ client, assert }) => {
    const attachment = await AttachmentFactory.create();

    const response = await client.get(`/v1/attachments/${attachment.id}`);

    response.assertStatus(200);
    response.assertBodyContains({
      id: attachment.id,
      title: attachment.title,
      ext: attachment.ext,
    });
    assert.properties(response.body(), ['id', 'title', 'ext', 'path', 'createdAt', 'updatedAt']);
  });

  test('should get attachment with posts', async ({ client, assert }) => {
    const attachment = await AttachmentFactory.with('posts', 3).create();

    const response = await client.get(`/v1/attachments/${attachment.id}`);

    response.assertStatus(200);
    assert.properties(response.body(), ['id', 'title', 'ext', 'posts']);
    assert.isArray(response.body().posts);
    assert.lengthOf(response.body().posts, 3);
  });

  test('should get attachment without posts when no posts attached', async ({ client, assert }) => {
    const attachment = await AttachmentFactory.create();

    const response = await client.get(`/v1/attachments/${attachment.id}`);

    response.assertStatus(200);
    assert.properties(response.body(), ['id', 'title', 'ext', 'posts']);
    assert.isArray(response.body().posts);
    assert.lengthOf(response.body().posts, 0);
  });

  test('should fail to get attachment with non-existent id', async ({ client }) => {
    const response = await client.get('/v1/attachments/999999');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'database.exists' }],
    });
  });

  test('should fail to get attachment with negative id', async ({ client }) => {
    const response = await client.get('/v1/attachments/-1');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'positive' }],
    });
  });

  test('should fail to get attachment with decimal id', async ({ client }) => {
    const response = await client.get('/v1/attachments/1.5');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'withoutDecimals' }],
    });
  });

  test('should fail to get attachment with invalid id', async ({ client }) => {
    const response = await client.get('/v1/attachments/invalid');

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id' }],
    });
  });
});
