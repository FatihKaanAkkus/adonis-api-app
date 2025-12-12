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
import env from './env.js';

const AuthController = () => import('#controllers/auth_controller');
const UsersController = () => import('#controllers/users_controller');
const PostsController = () => import('#controllers/posts_controller');
const CategoriesController = () => import('#controllers/categories_controller');
const AttachmentsController = () => import('#controllers/attachments_controller');
const SettingsController = () => import('#controllers/settings_controller');

router.get('/', () => ({ versions: [{ version: 'v1' }] }));

router
  .group(() => {
    router.get('/', () => ({ version: 'v1' }));

    router
      .group(() => {
        router.post('login', [AuthController, 'login']);
        const registerRoute = router.post('register', [AuthController, 'register']);
        /* c8 ignore next 3 */
        if (env.get('NODE_ENV', 'production') === 'production') {
          registerRoute.use(middleware.auth({ guards: ['api'] }));
        }
      })
      .prefix('auth');

    router
      .resource('users', UsersController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['api'] }));

    router
      .resource('posts', PostsController)
      .apiOnly()
      .use(['store', 'update', 'destroy'], middleware.auth({ guards: ['api'] }));

    router
      .group(() => {
        router.get('/', [CategoriesController, 'index']).as('index');
        router
          .post('/', [CategoriesController, 'store'])
          .as('store')
          .use(middleware.auth({ guards: ['api'] }));
        router
          .delete('/', [CategoriesController, 'destroy'])
          .as('destroy')
          .use(middleware.auth({ guards: ['api'] }));
      })
      .prefix('posts/:post_id/categories')
      .as('posts.categories');

    router
      .group(() => {
        router.get('/', [AttachmentsController, 'index']).as('index');
        router
          .post('/', [AttachmentsController, 'store'])
          .as('store')
          .use(middleware.auth({ guards: ['api'] }));
        router
          .delete('/', [AttachmentsController, 'destroy'])
          .as('destroy')
          .use(middleware.auth({ guards: ['api'] }));
      })
      .prefix('posts/:post_id/attachments')
      .as('posts.attachments');

    router
      .resource('categories', CategoriesController)
      .apiOnly()
      .use(['store', 'update', 'destroy'], middleware.auth({ guards: ['api'] }));

    router
      .group(() => {
        router.get('/', [PostsController, 'index']).as('index');
        router
          .post('/', [PostsController, 'store'])
          .as('store')
          .use(middleware.auth({ guards: ['api'] }));
        router
          .delete('/', [PostsController, 'destroy'])
          .as('destroy')
          .use(middleware.auth({ guards: ['api'] }));
      })
      .prefix('categories/:category_id/posts')
      .as('categories.posts');

    router
      .resource('attachments', AttachmentsController)
      .apiOnly()
      .use(['store', 'update', 'destroy'], middleware.auth({ guards: ['api'] }));

    router
      .group(() => {
        router.get('/', [PostsController, 'index']).as('index');
        router
          .post('/', [PostsController, 'store'])
          .as('store')
          .use(middleware.auth({ guards: ['api'] }));
        router
          .delete('/', [PostsController, 'destroy'])
          .as('destroy')
          .use(middleware.auth({ guards: ['api'] }));
      })
      .prefix('attachments/:attachment_id/posts')
      .as('attachments.posts');

    router
      .resource('settings', SettingsController)
      .apiOnly()
      .use(['store', 'update', 'destroy'], middleware.auth({ guards: ['api'] }));
  })
  .prefix('v1');
