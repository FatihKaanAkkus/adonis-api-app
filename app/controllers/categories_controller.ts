import Category from '#models/category';
import {
  categoryIndexValidator,
  categoryShowValidator,
  categoryStoreValidator,
  categoryUpdateValidator,
} from '#validators/category';
import type { HttpContext } from '@adonisjs/core/http';

export default class CategoriesController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const { page = 1, perPage = 10 } = await request.validateUsing(categoryIndexValidator);
    const categories = await Category.query().preload('posts').paginate(page, perPage);
    return response.ok(categories);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(categoryStoreValidator);
    const category = await Category.create(payload);
    return response.created(category);
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(categoryShowValidator);
    const category = await Category.findOrFail(params.id);
    await category.load('posts');
    return response.ok(category);
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(categoryShowValidator);
    const payload = await request.validateUsing(categoryUpdateValidator, { meta: params });
    const category = await Category.findOrFail(params.id);
    category.merge(payload);
    await category.save();
    return response.ok(category);
  }

  /**
   * Delete record
   */
  async destroy({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(categoryShowValidator);
    const category = await Category.findOrFail(params.id);
    await category.delete();
    return response.ok({ message: 'Category deleted' });
  }
}
