import factory from '@adonisjs/lucid/factories';
import Category from '#models/category';
import { PostFactory } from '#database/factories/post_factory';

export const CategoryFactory = factory
  .define(Category, async ({ faker }) => {
    return {
      uri: faker.lorem.slug(),
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
    };
  })
  .relation('posts', () => PostFactory)
  .build();
