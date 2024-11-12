/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router';
import { middleware } from '#start/kernel';

const AuthController = () => import('#controllers/auth_controller');
const UsersController = () => import('#controllers/users_controller');
const PostsController = () => import('#controllers/posts_controller');
const CategoriesController = () => import('#controllers/categories_controller');
const SettingsController = () => import('#controllers/settings_controller');

router.get('/', () => ({ versions: [{ version: 'v1' }] }));

router
  .group(() => {
    router.get('/', () => ({ version: 'v1' }));

    router
      .group(() => {
        router.post('register', [AuthController, 'register']);
        router.post('login', [AuthController, 'login']);
      })
      .prefix('auth');

    router
      .resource('users', UsersController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['api'] }));

    router
      .resource('posts', PostsController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['api'] }));

    router
      .group(() => {
        router.get('/', [CategoriesController, 'index']).as('index');
        router.post('/', [CategoriesController, 'store']).as('store');
        router.delete('/', [CategoriesController, 'destroy']).as('destroy');
      })
      .prefix('posts/:post_id/categories')
      .as('posts.categories')
      .use(middleware.auth({ guards: ['api'] }));

    router
      .resource('categories', CategoriesController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['api'] }));

    router
      .group(() => {
        router.get('/', [PostsController, 'index']).as('index');
        router.post('/', [PostsController, 'store']).as('store');
        router.delete('/', [PostsController, 'destroy']).as('destroy');
      })
      .prefix('categories/:category_id/posts')
      .as('categories.posts')
      .use(middleware.auth({ guards: ['api'] }));

    router
      .resource('settings', SettingsController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['api'] }));
  })
  .prefix('v1');
