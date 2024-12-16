import Category from '#models/category';
import Post from '#models/post';
import {
  categoryDestroyValidator,
  categoryIdsDestroyValidator,
  categoryIdsStoreValidator,
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
    const {
      params,
      page = 1,
      perPage = 10,
      withPosts = false,
      uri,
      name,
    } = await request.validateUsing(categoryIndexValidator);

    if (params.post_id) {
      const categories = await Category.query()
        .whereHas('posts', (postsQuery) => {
          if (params.post_id) {
            postsQuery.where('posts.id', params.post_id);
          }
        })
        .exec();
      return response.ok(categories);
    }

    const query = Category.query();
    if (uri) {
      if (uri.startsWith('%')) {
        query.whereLike('uri', uri);
      } else {
        query.where('uri', uri);
      }
    }
    if (name) {
      if (name.startsWith('%')) {
        query.whereLike('name', name);
      } else {
        query.where('name', name);
      }
    }
    if (withPosts) {
      query.preload('posts');
    }
    const categories = await query.paginate(page, perPage);
    return response.ok(categories);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const { params, ...payload } = await request.validateUsing(categoryStoreValidator);

    if (params.post_id) {
      const { categoryIds, categoryUris } = await request.validateUsing(categoryIdsStoreValidator, {
        meta: { post_id: params.post_id },
      });

      if (!categoryIds && !categoryUris) {
        return response.badRequest({
          message:
            'Field "categoryIds" or "categoryUris" must be provided ' +
            'when attaching categories to a post',
        });
      }

      const categoryQuery = Category.query();
      if (categoryIds) {
        for (const categoryId of categoryIds) {
          categoryQuery.orWhere('id', categoryId);
        }
      } else if (categoryUris) {
        for (const categoryUri of categoryUris) {
          categoryQuery.orWhere('uri', categoryUri);
        }
      }
      const ids = (await categoryQuery.exec()).map((category) => category.id);
      const post = await Post.findOrFail(params.post_id);
      await post.related('categories').attach(ids);
      return response.ok(categoryIds || categoryUris);
    }

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
    const { params } = await request.validateUsing(categoryDestroyValidator);

    if (params.post_id) {
      const { categoryIds, categoryUris } = await request.validateUsing(
        categoryIdsDestroyValidator,
        { meta: { post_id: params.post_id } }
      );

      if (!categoryIds && !categoryUris) {
        return response.badRequest({
          message:
            'Field "categoryIds" or "categoryUris" must be provided ' +
            'when detaching categories from a post',
        });
      }

      const categoryQuery = Category.query();
      if (categoryIds) {
        for (const categoryId of categoryIds) {
          categoryQuery.orWhere('id', categoryId);
        }
      } else if (categoryUris) {
        for (const categoryUri of categoryUris) {
          categoryQuery.orWhere('uri', categoryUri);
        }
      }
      const ids = (await categoryQuery.exec()).map((category) => category.id);
      const post = await Post.findOrFail(params.post_id);
      await post.related('categories').detach(ids);
      return response.ok(categoryIds || categoryUris);
    }

    const category = await Category.findOrFail(params.id);
    await category.delete();
    return response.ok({ message: 'Category deleted' });
  }
}
