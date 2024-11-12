import factory from '@adonisjs/lucid/factories';
import User from '#models/user';
import { PostFactory } from '#database/factories/post_factory';
import { ProfileFactory } from '#database/factories/profile_factory';

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      email: faker.internet.email(),
      password: faker.internet.password(),
      fullName: faker.person.fullName(),
    };
  })
  .relation('profile', () => ProfileFactory)
  .relation('posts', () => PostFactory)
  .build();
