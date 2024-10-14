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
    const { page = 1, perPage = 10 } = await userIndexValidator.validate(request.all());
    const users = await User.query().paginate(page, perPage);
    return response.ok(users);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const payload = await userStoreValidator.validate(request.all());
    const user = await User.create(payload);
    return response.created(user);
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    const payload = await userShowValidator.validate(params);
    const user = await User.findOrFail(payload.id);
    return response.ok(user);
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    const meta = await userShowValidator.validate(params);
    const payload = await userUpdateValidator.validate(request.all(), { meta });
    const user = await User.findOrFail(meta.id);
    user.merge(payload);
    await user.save();
    return response.ok(user);
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const payload = await userShowValidator.validate(params);
    const user = await User.findOrFail(payload.id);
    await user.delete();
    return response.ok({ message: 'User deleted' });
  }
}
