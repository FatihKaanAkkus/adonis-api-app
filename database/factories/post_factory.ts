import Post, { PostType } from '#models/post';
import factory from '@adonisjs/lucid/factories';
import { UserFactory } from '#database/factories/user_factory';
import { CategoryFactory } from '#database/factories/category_factory';
import { AttachmentFactory } from '#database/factories/attachment_factory';

export const PostFactory = factory
  .define(Post, async ({ faker }) => {
    return {
      type: faker.helpers.arrayElement(['post', 'page']) as PostType,
      uri: faker.lorem.slug(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      description: faker.lorem.sentence(),
      coverImage: faker.image.url(),
    };
  })
  .relation('user', () => UserFactory)
  .relation('categories', () => CategoryFactory)
  .relation('attachments', () => AttachmentFactory)
  .state('post', (post) => (post.type = 'post'))
  .state('page', (post) => (post.type = 'page'))
  .build();
