import { CategoryFactory } from '#database/factories/category_factory';
import { UserFactory } from '#database/factories/user_factory';
import Post from '#models/post';
import factory from '@adonisjs/lucid/factories';

export const PostFactory = factory
  .define(Post, async ({ faker }) => {
    return {
      uri: faker.lorem.slug(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      description: faker.lorem.sentence(),
    };
  })
  .relation('categories', () => CategoryFactory)
  .relation('user', () => UserFactory)
  .build();
