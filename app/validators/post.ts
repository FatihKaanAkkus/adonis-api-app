import vine from '@vinejs/vine';

export const postIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),

    params: vine.object({
      category_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('categories').where('id', value).first());
        })
        .optional(),
    }),
  })
);

export const postStoreValidator = vine.compile(
  vine.object({
    uri: vine
      .string()
      .escape()
      .unique(async (db, value) => {
        return !(await db.from('posts').where('uri', value).first());
      })
      .optional()
      .requiredIfMissing('params.category_id'),
    title: vine.string().optional().requiredIfMissing('params.category_id'),
    description: vine.string().nullable().optional().requiredIfMissing('params.category_id'),
    content: vine.string().optional().requiredIfMissing('params.category_id'),
    userId: vine
      .number()
      .positive()
      .withoutDecimals()
      .nullable()
      .optional()
      .requiredIfMissing('params.category_id'),

    params: vine.object({
      category_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('categories').where('id', value).first());
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
        .requiredIfMissing('params.category_id'),

      category_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('categories').where('id', value).first());
        })
        .optional(),
    }),
  })
);

/**
 * If the params.category_id is provided, then the postIds must be provided and
 * the items must exist in the pivot table.
 */
export const postIdsStoreValidator = vine.withMetaData<{ category_id: number }>().compile(
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
          return !(await db
            .from('category_post')
            .where('post_id', value)
            .andWhere('category_id', field.meta.category_id)
            .first());
        })
    ),
  })
);

/**
 * If the postIds is provided, then the postIds must exist in the pivot table.
 */
export const postIdsDestroyValidator = vine.withMetaData<{ category_id: number }>().compile(
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
          return !!(await db
            .from('category_post')
            .where('post_id', value)
            .andWhere('category_id', field.meta.category_id)
            .first());
        })
    ),
  })
);
