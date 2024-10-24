import type { HttpContext } from '@adonisjs/core/http';
import { authLoginValidator, authRegisterValidator } from '#validators/auth';
import User from '#models/user';

export default class AuthController {
  /**
   * Register a new user
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(authRegisterValidator);
    const user = await User.create(payload);
    return response.created({ user });
  }

  /**
   * Validate user credentials and return a new access token
   */
  async login({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(authLoginValidator);
      const user = await User.verifyCredentials(payload.email, payload.password);

      // Allow only one token per user
      const tokens = await User.accessTokens.all(user);
      for (const token of tokens) {
        await User.accessTokens.delete(user, token.identifier);
      }

      const token = await User.accessTokens.create(user, ['*'], { expiresIn: '1 day' });
      return response.ok({ user, token });
    } catch (error) {
      if (error.code !== 'E_INVALID_CREDENTIALS') {
        console.error(error.message);
      }
      return response.unauthorized({ message: 'Invalid credentials' });
    }
  }
}
