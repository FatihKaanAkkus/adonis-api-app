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
    const { page = 1, perPage = 10 } = await request.validateUsing(userIndexValidator);
    const users = await User.query().paginate(page, perPage);
    return response.ok(users);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(userStoreValidator);
    const user = await User.create(payload);
    return response.created(user);
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(userShowValidator);
    const user = await User.findOrFail(params.id);
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
