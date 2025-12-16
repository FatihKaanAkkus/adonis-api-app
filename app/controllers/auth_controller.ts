import type { HttpContext } from '@adonisjs/core/http';
import { authLoginValidator, authRegisterValidator } from '#validators/auth';
import User from '#models/user';
import env from '#start/env';

export default class AuthController {
  /**
   * Register a new user
   */
  async register({ request, response }: HttpContext) {
    const { profile = {}, ...payload } = await request.validateUsing(authRegisterValidator);
    const user = await User.create(payload);
    await user.related('profile').create(profile);
    await user.load('profile');
    return response.created({ user });
  }

  /**
   * Validate user credentials and return a new access token
   */
  async login({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(authLoginValidator);
      const user = await User.verifyCredentials(payload.email, payload.password);

      const clientType = request.header('X-Client-Type');
      if (clientType === 'web') {
        await auth.use('web').login(user);
        await user.load('profile');
        return response.ok({ user });
      }

      await user.load('profile');

      // Allow only one token per user
      const tokens = await User.accessTokens.all(user);
      for (const token of tokens) {
        await User.accessTokens.delete(user, token.identifier);
      }

      const token = await User.accessTokens.create(user, ['*'], { expiresIn: '1 day' });
      return response.ok({ user, token });
    } catch (error) {
      /* c8 ignore next 3 */
      if (error.code !== 'E_INVALID_CREDENTIALS' && env.get('NODE_ENV') === 'development') {
        console.error(error.message);
      }
      return response.unauthorized({ message: 'Invalid credentials' });
    }
  }
}
