import Attachment from '#models/attachment';
import Category from '#models/category';
import Post from '#models/post';
import {
  postDestroyValidator,
  postIdsDestroyValidator,
  postIdsStoreValidator,
  postIndexValidator,
  postShowValidator,
  postStoreValidator,
  postUpdateValidator,
} from '#validators/post';
import type { HttpContext } from '@adonisjs/core/http';

export default class PostsController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const {
      params,
      page = 1,
      perPage = 10,
      withCategories = true,
      withAttachments = false,
      type = 'post',
      uri,
      title,
      description,
      userId,
    } = await request.validateUsing(postIndexValidator);

    if (params.category_id) {
      const posts = await Post.query()
        .whereHas('categories', (categoriesQuery) => {
          categoriesQuery.where('categories.id', params.category_id!);
        })
        .preload('user')
        .preload('categories')
        .exec();
      return response.ok(posts);
    }
    if (params.attachment_id) {
      const posts = await Post.query()
        .whereHas('attachments', (attachmentsQuery) => {
          attachmentsQuery.where('attachments.id', params.attachment_id!);
        })
        .preload('user')
        .preload('categories')
        .preload('attachments')
        .exec();
      return response.ok(posts);
    }

    const query = Post.query();
    if (type) {
      if (type.startsWith('%')) {
        query.whereLike('type', type);
      } else {
        query.where('type', type);
      }
    }
    if (uri) {
      if (uri.startsWith('%')) {
        query.whereLike('uri', uri);
      } else {
        query.where('uri', uri);
      }
    }
    if (title) {
      if (title.startsWith('%')) {
        query.whereLike('title', title);
      } else {
        query.where('title', title);
      }
    }
    if (description) {
      if (description.startsWith('%')) {
        query.whereLike('description', description);
      } else {
        query.where('description', description);
      }
    }
    if (userId) {
      query.where('user_id', userId);
    }
    query.preload('user');
    if (withCategories) {
      query.preload('categories');
    }
    query.has('attachments', '>', 0);
    if (withAttachments) {
      query.preload('attachments');
    }
    const posts = await query.paginate(page, perPage);
    return response.ok(posts);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const { params, ...payload } = await request.validateUsing(postStoreValidator);

    if (params.category_id) {
      const { postIds } = await request.validateUsing(postIdsStoreValidator, {
        meta: { category_id: params.category_id },
      });

      if (!postIds) {
        return response.badRequest({
          message: 'Field postIds must be provided when attaching posts to a category',
        });
      }

      const postQuery = Post.query();
      for (const postId of postIds) {
        postQuery.orWhere('id', postId);
      }
      const ids = (await postQuery.exec()).map((post) => post.id);
      const category = await Category.findOrFail(params.category_id);
      await category.related('posts').attach(ids);
      return response.ok(postIds);
    }

    if (params.attachment_id) {
      const { postIds } = await request.validateUsing(postIdsStoreValidator, {
        meta: { attachment_id: params.attachment_id },
      });

      if (!postIds) {
        return response.badRequest({
          message: 'Field postIds must be provided when attaching posts to an attachment',
        });
      }

      const postQuery = Post.query();
      for (const postId of postIds) {
        postQuery.orWhere('id', postId);
      }
      const ids = (await postQuery.exec()).map((post) => post.id);
      const attachment = await Attachment.findOrFail(params.attachment_id);
      await attachment.related('posts').attach(ids);
      return response.ok(postIds);
    }

    const post = await Post.create(payload);
    return response.created(post);
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(postShowValidator);
    const post = await Post.findOrFail(params.id);
    await post.load('user');
    await post.load('categories');
    return response.ok(post);
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(postShowValidator);
    const payload = await request.validateUsing(postUpdateValidator, { meta: params });
    const post = await Post.findOrFail(params.id);
    post.merge(payload);
    await post.save();
    return response.ok(post);
  }

  /**
   * Delete record
   */
  async destroy({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(postDestroyValidator);

    if (params.category_id) {
      const { postIds } = await request.validateUsing(postIdsDestroyValidator, {
        meta: { category_id: params.category_id },
      });

      if (!postIds) {
        return response.badRequest({
          message: 'Field postIds must be provided when detaching posts from a category',
        });
      }

      const postQuery = Post.query();
      for (const postId of postIds) {
        postQuery.orWhere('id', postId);
      }
      const ids = await postQuery.exec();
      const category = await Category.findOrFail(params.category_id);
      await category.related('posts').detach(ids.map((post) => post.id));
      return response.ok(postIds);
    }

    if (params.attachment_id) {
      const { postIds } = await request.validateUsing(postIdsDestroyValidator, {
        meta: { attachment_id: params.attachment_id },
      });

      if (!postIds) {
        return response.badRequest({
          message: 'Field postIds must be provided when detaching posts from an attachment',
        });
      }

      const postQuery = Post.query();
      for (const postId of postIds) {
        postQuery.orWhere('id', postId);
      }
      const ids = (await postQuery.exec()).map((post) => post.id);
      const attachment = await Attachment.findOrFail(params.attachment_id);
      await attachment.related('posts').detach(ids);
      return response.ok(postIds);
    }

    const post = await Post.findOrFail(params.id);
    await post.delete();
    return response.ok({ message: 'Post deleted' });
  }
}
