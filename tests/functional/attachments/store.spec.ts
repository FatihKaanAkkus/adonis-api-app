import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { AttachmentFactory } from '#database/factories/attachment_factory';
import { PostFactory } from '#database/factories/post_factory';
import User from '#models/user';
import path, { join } from 'node:path';
import fs from 'node:fs';

test.group('Attachments store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());
  group.teardown(() => {
    const testStoragePath = path.join(process.cwd(), 'tmp/test_storage');
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true, force: true });
    }
  });

  test('should upload and create a new attachment', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .post('/v1/attachments')
      .bearerToken(token.value!.release())
      .fields({ title: 'Test Image' })
      .file('file', join(import.meta.dirname, '../../fixtures/test-image.png'));

    response.assertStatus(201);
    response.assertBodyContains({
      ext: 'png',
      title: 'Test Image',
    });

    assert.properties(response.body(), ['id', 'ext', 'path', 'size', 'title', 'createdAt']);
    assert.isString(response.body().path);
    assert.isNumber(response.body().size);
  });

  test('should upload attachment without title', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .post('/v1/attachments')
      .bearerToken(token.value!.release())
      .file('file', join(import.meta.dirname, '../../fixtures/test-image.jpg'));

    response.assertStatus(201);
    assert.properties(response.body(), ['id', 'ext', 'path', 'size', 'createdAt']);
    assert.equal(response.body().ext, 'jpg');
  });

  test('should upload attachment with custom filename using rename', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .post('/v1/attachments')
      .bearerToken(token.value!.release())
      .fields({ title: 'Custom Name', rename: 'my-custom-image' })
      .file('file', join(import.meta.dirname, '../../fixtures/test-image.png'));

    response.assertStatus(201);
    assert.include(response.body().path, 'my-custom-image.png');
  });

  test('should fail to upload without authentication', async ({ client }) => {
    const response = await client
      .post('/v1/attachments')
      .file('file', join(import.meta.dirname, '../../fixtures/test-image.png'));

    response.assertStatus(401);
  });

  test('should fail to upload without file', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .post('/v1/attachments')
      .bearerToken(token.value!.release())
      .fields({ title: 'No File' });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'file',
          rule: 'required',
        },
      ],
    });
  });

  test('should fail to upload file with invalid extension', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .post('/v1/attachments')
      .bearerToken(token.value!.release())
      .file('file', join(import.meta.dirname, '../../fixtures/test-docs.txt'));

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'file',
          rule: 'file.extname',
        },
      ],
    });
  });

  test('should attach existing attachments to a post', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();
    const attachment1 = await AttachmentFactory.create();
    const attachment2 = await AttachmentFactory.create();

    const response = await client
      .post(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [attachment1.id, attachment2.id],
      });

    response.assertStatus(200);
    response.assertBody([attachment1.id, attachment2.id]);

    // Verify the relationship was created
    await post.load('attachments');
    assert.lengthOf(post.attachments, 2);
    assert.includeMembers(
      post.attachments.map((a) => a.id),
      [attachment1.id, attachment2.id]
    );
  });

  test('should fail to attach attachments to post without attachmentIds', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();

    const response = await client
      .post(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(400);
    response.assertBodyContains({
      message: 'Filed "attachmentIds" must be provided when attaching attachments to a post',
    });
  });

  test('should fail to attach attachments to non-existent post', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();

    const response = await client
      .post('/v1/posts/99999/attachments')
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [attachment.id],
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

  test('should fail to attach non-existent attachments', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();

    const response = await client
      .post(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [99999, 99998],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'attachmentIds.0',
          rule: 'database.exists',
        },
      ],
    });
  });

  test('should fail to attach already attached attachments', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.create();
    const attachment = await AttachmentFactory.create();

    // First attach
    await post.related('attachments').attach([attachment.id]);

    // Try to attach again
    const response = await client
      .post(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [attachment.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: 'attachmentIds.0',
          rule: 'database.unique',
        },
      ],
    });
  });
});
