import factory from '@adonisjs/lucid/factories';
import Profile from '#models/profile';

export const ProfileFactory = factory
  .define(Profile, async ({ faker }) => {
    return {
      avatarUri: faker.image.avatar(),
      bio: faker.lorem.paragraph(),
    };
  })
  .build();
