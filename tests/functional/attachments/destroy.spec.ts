import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';
import { AttachmentFactory } from '#database/factories/attachment_factory';
import { PostFactory } from '#database/factories/post_factory';
import { UserFactory } from '#database/factories/user_factory';
import Attachment from '#models/attachment';
import User from '#models/user';

test.group('Attachments destroy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should delete attachment by id', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();

    const response = await client
      .delete(`/v1/attachments/${attachment.id}`)
      .bearerToken(token.value!.release());

    response.assertStatus(200);
    assert.properties(response.body(), ['message']);
    assert.equal(response.body().message, 'Attachment deleted');

    const deletedAttachment = await Attachment.find(attachment.id);
    assert.isNull(deletedAttachment);
  });

  test('should fail to delete attachment without authentication', async ({ client }) => {
    const attachment = await AttachmentFactory.create();

    const response = await client.delete(`/v1/attachments/${attachment.id}`);

    response.assertStatus(401);
  });

  test('should fail to delete attachment with invalid id format', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete('/v1/attachments/invalid')
      .bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'number' }],
    });
  });

  test('should fail to delete attachment with negative id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.delete('/v1/attachments/-1').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'positive' }],
    });
  });

  test('should fail to delete attachment with decimal id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client.delete('/v1/attachments/1.5').bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'withoutDecimals' }],
    });
  });

  test('should fail to delete non-existent attachment', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete('/v1/attachments/999999')
      .bearerToken(token.value!.release());

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'database.exists' }],
    });
  });

  test('should detach single attachment from post by id', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();
    const attachment = await AttachmentFactory.create();
    await post.related('attachments').attach([attachment.id]);

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [attachment.id],
      });

    response.assertStatus(200);
    assert.isArray(response.body());
    assert.lengthOf(response.body(), 1);
    assert.equal(response.body()[0], attachment.id);

    await post.load('attachments');
    assert.lengthOf(post.attachments, 0);
  });

  test('should detach multiple attachments from post by ids', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();
    const attachments = await AttachmentFactory.createMany(3);
    await post.related('attachments').attach(attachments.map((a) => a.id));

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: attachments.map((a) => a.id),
      });

    response.assertStatus(200);
    assert.isArray(response.body());
    assert.lengthOf(response.body(), 3);

    await post.load('attachments');
    assert.lengthOf(post.attachments, 0);
  });

  test('should detach only specified attachments from post', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();
    const attachments = await AttachmentFactory.createMany(3);
    await post.related('attachments').attach(attachments.map((a) => a.id));

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [attachments[0].id, attachments[1].id],
      });

    response.assertStatus(200);
    assert.lengthOf(response.body(), 2);

    await post.load('attachments');
    assert.lengthOf(post.attachments, 1);
    assert.equal(post.attachments[0].id, attachments[2].id);
  });

  test('should fail to detach attachments without authentication', async ({ client }) => {
    const post = await PostFactory.apply('post').create();
    const attachment = await AttachmentFactory.create();
    await post.related('attachments').attach([attachment.id]);

    const response = await client.delete(`/v1/posts/${post.id}/attachments`).json({
      attachmentIds: [attachment.id],
    });

    response.assertStatus(401);
  });

  test('should fail to detach attachments with invalid post id format', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete('/v1/posts/invalid/attachments')
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [1],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.post_id', rule: 'number' }],
    });
  });

  test('should fail to detach attachments with negative post id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete('/v1/posts/-1/attachments')
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [1],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.post_id', rule: 'positive' }],
    });
  });

  test('should fail to detach attachments with decimal post id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .delete('/v1/posts/1.5/attachments')
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [1],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.post_id', rule: 'withoutDecimals' }],
    });
  });

  test('should fail to detach attachments from non-existent post', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const attachment = await AttachmentFactory.create();

    const response = await client
      .delete('/v1/posts/999999/attachments')
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [attachment.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.post_id', rule: 'database.exists' }],
    });
  });

  test('should fail to detach attachments without attachmentIds field', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({});

    response.assertStatus(400);
  });

  test('should fail to detach non-existent attachment from post', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [999999],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'attachmentIds.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach attachment that is not attached to post', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();
    const attachment = await AttachmentFactory.create();

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [attachment.id],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'attachmentIds.0', rule: 'database.exists' }],
    });
  });

  test('should fail to detach attachments with invalid attachment id format', async ({
    client,
  }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: ['invalid'],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'attachmentIds.0', rule: 'number' }],
    });
  });

  test('should fail to detach attachments with negative attachment id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [-1],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'attachmentIds.0', rule: 'positive' }],
    });
  });

  test('should fail to detach attachments with decimal attachment id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const post = await PostFactory.apply('post').create();

    const response = await client
      .delete(`/v1/posts/${post.id}/attachments`)
      .bearerToken(token.value!.release())
      .json({
        attachmentIds: [1.5],
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'attachmentIds.0', rule: 'withoutDecimals' }],
    });
  });
});
