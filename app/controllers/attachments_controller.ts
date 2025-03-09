import Attachment from '#models/attachment';
import Post from '#models/post';
import {
  attachmentDestroyValidator,
  attachmentIdsDestroyValidator,
  attachmentIdsStoreValidator,
  attachmentIndexValidator,
  attachmentShowValidator,
  attachmentStoreValidator,
  attachmentUpdateValidator,
} from '#validators/attachment';
import { cuid } from '@adonisjs/core/helpers';
import type { HttpContext } from '@adonisjs/core/http';
import drive from '@adonisjs/drive/services/main';

export default class AttachmentsController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const {
      params,
      page = 1,
      perPage = 10,
      withPosts = false,
      hasPosts = false,
      ext,
      path,
      title,
    } = await request.validateUsing(attachmentIndexValidator);

    if (params.post_id) {
      const attachments = await Attachment.query()
        .whereHas('posts', (postsQuery) => {
          if (params.post_id) {
            postsQuery.where('posts.id', params.post_id);
          }
        })
        .orderBy('created_at', 'desc')
        .exec();
      return response.ok(attachments);
    }

    const query = Attachment.query();
    if (ext) {
      if (ext.startsWith('%')) {
        query.whereLike('ext', ext);
      } else {
        query.where('ext', ext);
      }
    }
    if (path) {
      if (path.startsWith('%')) {
        query.whereLike('path', path);
      } else {
        query.where('path', path);
      }
    }
    if (title) {
      if (title.startsWith('%')) {
        query.whereLike('title', title);
      } else {
        query.where('title', title);
      }
    }
    if (hasPosts) {
      query.has('posts', '>', 0);
    }
    if (withPosts) {
      query.preload('posts');
    }
    query.orderBy('created_at', 'desc');
    const attachments = await query.paginate(page, perPage);
    return response.ok(attachments);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const { params, rename, file, ...payload } =
      await request.validateUsing(attachmentStoreValidator);

    if (params.post_id) {
      const { attachmentIds } = await request.validateUsing(attachmentIdsStoreValidator, {
        meta: { post_id: params.post_id },
      });

      if (!attachmentIds) {
        return response.badRequest({
          message:
            'Filed "attachmentIds" must be provided ' + 'when attaching attachments to a post',
        });
      }

      const attachmentQuery = Attachment.query();
      for (const attachmentId of attachmentIds) {
        attachmentQuery.orWhere('id', attachmentId);
      }
      attachmentQuery.orderBy('created_at', 'desc');
      const ids = (await attachmentQuery.exec()).map((attachment) => attachment.id);
      const post = await Post.findOrFail(params.post_id);
      await post.related('attachments').attach(ids);
      return response.ok(attachmentIds);
    }

    const image = request.file('file', { size: '10mb', extnames: ['jpeg', 'jpg', 'png', 'webp'] });
    if (!image) {
      return response.badRequest({ message: 'Image file must be provided' });
    }

    const key = rename
      ? `uploads/${rename}.${image.extname}`
      : `uploads/${cuid()}.${image.extname}`;

    if (await drive.use().exists(key)) {
      return response.badRequest({ message: 'File already exists' });
    }

    await image.moveToDisk(key);
    const url = await drive.use().getUrl(key);

    const attachment = await Attachment.create({
      ...payload,
      ext: image.extname,
      path: url,
    });
    return response.created(attachment);
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(attachmentShowValidator);
    const attachment = await Attachment.findOrFail(params.id);
    await attachment.load('posts');
    return response.ok(attachment);
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(attachmentShowValidator);
    const payload = await request.validateUsing(attachmentUpdateValidator, { meta: params });
    const attachment = await Attachment.findOrFail(params.id);
    attachment.merge(payload);
    await attachment.save();
    return response.ok(attachment);
  }

  /**
   * Delete record
   */
  async destroy({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(attachmentDestroyValidator);

    if (params.post_id) {
      const { attachmentIds } = await request.validateUsing(attachmentIdsDestroyValidator, {
        meta: { post_id: params.post_id },
      });

      if (!attachmentIds) {
        return response.badRequest({
          message:
            'Filed "attachmentIds" must be provided ' + 'when detaching attachments from a post',
        });
      }

      const attachmentQuery = Attachment.query();
      for (const attachmentId of attachmentIds) {
        attachmentQuery.orWhere('id', attachmentId);
      }
      attachmentQuery.orderBy('created_at', 'desc');
      const ids = (await attachmentQuery.exec()).map((attachment) => attachment.id);
      const post = await Post.findOrFail(params.post_id);
      await post.related('attachments').detach(ids);
      return response.ok(attachmentIds);
    }

    const attachment = await Attachment.findOrFail(params.id);
    await attachment.delete();
    return response.ok({ message: 'Attachment deleted' });
  }
}
