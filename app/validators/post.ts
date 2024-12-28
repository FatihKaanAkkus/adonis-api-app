import vine from '@vinejs/vine';

export const postIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),
    withCategories: vine.boolean().optional(),
    hasCategories: vine.boolean().optional(),
    withAttachments: vine.boolean().optional(),
    hasAttachments: vine.boolean().optional(),
    type: vine.enum(['post', 'page']).optional(),
    uri: vine.string().trim().ascii().escape().maxLength(255).optional(),
    title: vine.string().trim().ascii().escape().maxLength(255).optional(),
    description: vine.string().trim().ascii().escape().maxLength(255).optional(),
    userId: vine.number().positive().withoutDecimals().optional(),
    // @todo older then
    // @todo newer then

    params: vine.object({
      category_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('categories').where('id', value).first());
        })
        .optional(),
      attachment_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('attachments').where('id', value).first());
        })
        .optional(),
    }),
  })
);

export const postStoreValidator = vine.compile(
  vine.object({
    type: vine
      .enum(['post', 'page'])
      .optional()
      .requiredIfMissing(['params.category_id', 'params.attachment_id']),
    uri: vine
      .string()
      .escape()
      .unique(async (db, value) => {
        return !(await db.from('posts').where('uri', value).first());
      })
      .optional()
      .requiredIfMissing(['params.category_id', 'params.attachment_id']),
    title: vine
      .string()
      .optional()
      .requiredIfMissing(['params.category_id', 'params.attachment_id']),
    description: vine
      .string()
      .nullable()
      .optional()
      .requiredIfMissing(['params.category_id', 'params.attachment_id']),
    content: vine
      .string()
      .optional()
      .requiredIfMissing(['params.category_id', 'params.attachment_id']),
    coverImage: vine
      .string()
      .nullable()
      .optional()
      .requiredIfMissing(['params.category_id', 'params.attachment_id']),
    userId: vine
      .number()
      .positive()
      .withoutDecimals()
      .nullable()
      .optional()
      .requiredIfMissing(['params.category_id', 'params.attachment_id']),

    params: vine.object({
      category_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('categories').where('id', value).first());
        })
        .optional(),
      attachment_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('attachments').where('id', value).first());
        })
        .optional(),
    }),
  })
);

export const postShowValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('posts').where('id', value).first());
        }),
    }),
  })
);

export const postUpdateValidator = vine.withMetaData<{ id: number }>().compile(
  vine.object({
    type: vine.enum(['post', 'page']).optional(),
    uri: vine
      .string()
      .trim()
      .escape()
      .unique(async (db, value, field) => {
        return !(await db.from('posts').where('uri', value).whereNot('id', field.meta.id).first());
      }),
    title: vine.string().optional(),
    description: vine.string().nullable().optional(),
    content: vine.string().optional(),
    coverImage: vine.string().nullable().optional(),
    userId: vine.number().positive().withoutDecimals().nullable().optional(),
  })
);

export const postDestroyValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('posts').where('id', value).first());
        })
        .optional()
        .requiredIfMissing(['params.category_id', 'params.attachment_id']),

      category_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('categories').where('id', value).first());
        })
        .optional(),
      attachment_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('attachments').where('id', value).first());
        })
        .optional(),
    }),
  })
);

/**
 * If the params.category_id is provided, then the postIds must be provided and
 * the items must exist in the pivot table.
 */
export const postIdsStoreValidator = vine
  .withMetaData<{ category_id?: number; attachment_id?: number }>()
  .compile(
    vine.object({
      postIds: vine.array(
        vine
          .number()
          .positive()
          .withoutDecimals()
          .exists(async (db, value) => {
            return !!(await db.from('posts').where('id', value).first());
          })
          .unique(async (db, value, field) => {
            if (field.meta.category_id) {
              return !(await db
                .from('category_post')
                .where('post_id', value)
                .where('category_id', field.meta.category_id)
                .first());
            }
            if (field.meta.attachment_id) {
              return !(await db
                .from('attachment_post')
                .where('post_id', value)
                .where('attachment_id', field.meta.attachment_id)
                .first());
            }
            return false;
          })
      ),
    })
  );

/**
 * If the postIds is provided, then the postIds must exist in the pivot table.
 */
export const postIdsDestroyValidator = vine
  .withMetaData<{ category_id?: number; attachment_id?: number }>()
  .compile(
    vine.object({
      postIds: vine.array(
        vine
          .number()
          .positive()
          .withoutDecimals()
          .exists(async (db, value) => {
            return !!(await db.from('posts').where('id', value).first());
          })
          .exists(async (db, value, field) => {
            if (field.meta.category_id) {
              return !!(await db
                .from('category_post')
                .where('post_id', value)
                .andWhere('category_id', field.meta.category_id)
                .first());
            }
            if (field.meta.attachment_id) {
              return !!(await db
                .from('attachment_post')
                .where('post_id', value)
                .andWhere('attachment_id', field.meta.attachment_id)
                .first());
            }
            return false;
          })
      ),
    })
  );
