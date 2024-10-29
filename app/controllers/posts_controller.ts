import Post from '#models/post';
import {
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
    const { page = 1, perPage = 10 } = await request.validateUsing(postIndexValidator);
    const posts = await Post.query().preload('user').preload('categories').paginate(page, perPage);
    return response.ok(posts);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(postStoreValidator);
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
    const { params } = await request.validateUsing(postShowValidator);
    const post = await Post.findOrFail(params.id);
    await post.delete();
    return response.ok({ message: 'Post deleted' });
  }
}
