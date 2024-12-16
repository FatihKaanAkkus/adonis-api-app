import { CategoryFactory } from '#database/factories/category_factory';
import { UserFactory } from '#database/factories/user_factory';
import Post, { PostType } from '#models/post';
import factory from '@adonisjs/lucid/factories';

export const PostFactory = factory
  .define(Post, async ({ faker }) => {
    return {
      type: faker.helpers.arrayElement(['post', 'page']) as PostType,
      uri: faker.lorem.slug(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      description: faker.lorem.sentence(),
    };
  })
  .relation('categories', () => CategoryFactory)
  .relation('user', () => UserFactory)
  .build();
