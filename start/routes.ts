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
      .resource('categories', CategoriesController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['api'] }));
  })
  .prefix('v1');
