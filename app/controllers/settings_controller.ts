import Setting from '#models/setting';
import {
  settingIndexValidator,
  settingShowValidator,
  settingStoreValidator,
  settingUpdateValidator,
} from '#validators/setting';
import type { HttpContext } from '@adonisjs/core/http';

export default class UsersController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 10,
      group,
      key,
    } = await request.validateUsing(settingIndexValidator);

    const query = Setting.query();
    if (group) {
      if (group.startsWith('%')) {
        query.whereLike('group', group);
      } else {
        query.where('group', group);
      }
    }
    if (key) {
      if (key.startsWith('%')) {
        query.whereLike('key', key);
      } else {
        query.where('key', key);
      }
    }
    const settings = await query.paginate(page, perPage);
    return response.ok(settings);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const { group = 'client', ...payload } = await request.validateUsing(settingStoreValidator);
    const setting = await Setting.create({ group, ...payload });
    return response.created(setting);
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(settingShowValidator);
    const setting = await Setting.findByOrFail({ key: params.id });
    return response.ok(setting);
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(settingShowValidator);
    const payload = await request.validateUsing(settingUpdateValidator);
    const setting = await Setting.findByOrFail({ key: params.id });
    setting.merge(payload);
    await setting.save();
    return response.ok(setting);
  }

  /**
   * Delete record
   */
  async destroy({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(settingShowValidator);
    const setting = await Setting.findByOrFail({ key: params.id });
    await setting.delete();
    return response.ok({ message: 'Setting deleted' });
  }
}
