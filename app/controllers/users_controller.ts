import User from '#models/user';
import {
  userIndexValidator,
  userShowValidator,
  userStoreValidator,
  userUpdateValidator,
} from '#validators/user';
import type { HttpContext } from '@adonisjs/core/http';

export default class UsersController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 10,
      withPosts = false,
      email,
      fullName,
    } = await request.validateUsing(userIndexValidator);

    const query = User.query();
    if (email) {
      if (email.startsWith('%')) {
        query.whereLike('email', email);
      } else {
        query.where('email', email);
      }
    }
    if (fullName) {
      if (fullName.startsWith('%')) {
        query.whereLike('fullName', fullName);
      } else {
        query.where('fullName', fullName);
      }
    }
    if (withPosts) {
      query.preload('posts', (postsQuery) => {
        postsQuery.preload('categories');
      });
    }
    const users = await query.paginate(page, perPage);
    return response.ok(users);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const { profile = {}, ...payload } = await request.validateUsing(userStoreValidator);
    const user = await User.create(payload);
    await user.related('profile').create(profile);
    await user.load('profile');
    return response.created(user);
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(userShowValidator);
    const user = await User.findOrFail(params.id);
    await user.load('profile');
    return response.ok(user);
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(userShowValidator);
    const payload = await request.validateUsing(userUpdateValidator, { meta: params });
    const user = await User.findOrFail(params.id);
    user.merge(payload);
    await user.save();
    await user.load('profile');
    return response.ok(user);
  }

  /**
   * Delete record
   */
  async destroy({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(userShowValidator);
    const user = await User.findOrFail(params.id);
    await user.delete();
    return response.ok({ message: 'User deleted' });
  }
}
