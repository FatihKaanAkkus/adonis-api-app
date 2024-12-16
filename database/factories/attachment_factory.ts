import factory from '@adonisjs/lucid/factories';
import Attachment from '#models/attachment';
import { PostFactory } from '#database/factories/post_factory';

export const AttachmentFactory = factory
  .define(Attachment, async ({ faker }) => {
    const extension = faker.helpers.arrayElement(['svg', 'png', 'jpeg']);
    return {
      ext: extension,
      path: faker.system.commonFileName(extension),
      size: faker.number.int({ min: 1, max: 1000 }),
      title: faker.lorem.sentence(),
    };
  })
  .relation('posts', () => PostFactory)
  .build();
