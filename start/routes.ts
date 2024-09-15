/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router';

const AuthController = () => import('#controllers/auth_controller');

router.get('/', () => ({ versions: [{ version: 'v1' }] }));

router
  .group(() => {
    router.get('/', () => ({ version: 'v1' }));

    router.post('register', [AuthController, 'register']);
    router.post('login', [AuthController, 'login']);
  })
  .prefix('v1');
