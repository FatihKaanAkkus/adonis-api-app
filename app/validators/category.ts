import vine from '@vinejs/vine';

export const categoryIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),

    params: vine.object({
      post_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('posts').where('id', value).first());
        })
        .optional(),
    }),
  })
);

export const categoryStoreValidator = vine.compile(
  vine.object({
    uri: vine
      .string()
      .escape()
      .unique(async (db, value) => {
        return !(await db.from('categories').where('uri', value).first());
      })
      .optional()
      .requiredIfMissing('params.post_id'),
    name: vine.string().optional().requiredIfMissing('params.post_id'),
    description: vine.string().nullable().optional().requiredIfMissing('params.post_id'),

    params: vine.object({
      post_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('posts').where('id', value).first());
        })
        .optional(),
    }),
  })
);

export const categoryShowValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('categories').where('id', value).first());
        }),
    }),
  })
);

export const categoryUpdateValidator = vine.withMetaData<{ id: number }>().compile(
  vine.object({
    uri: vine
      .string()
      .escape()
      .unique(async (db, value, field) => {
        return !(await db
          .from('categories')
          .where('uri', value)
          .whereNot('id', field.meta.id)
          .first());
      }),
    name: vine.string(),
    description: vine.string().nullable(),
  })
);

export const categoryDestroyValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('categories').where('id', value).first());
        })
        .optional()
        .requiredIfMissing('params.post_id'),

      post_id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('posts').where('id', value).first());
        })
        .optional(),
    }),
  })
);

/**
 * If the params.post_id is provided, then the categoryIds must be provided and
 * the items must exist in the pivot table. Use {@link categoryIdsStoreValidator}
 * to validate the params first.
 */
export const categoryIdsStoreValidator = vine.withMetaData<{ post_id: number }>().compile(
  vine.object({
    categoryIds: vine
      .array(
        vine
          .number()
          .positive()
          .withoutDecimals()
          .exists(async (db, value) => {
            return !!(await db.from('categories').where('id', value).first());
          })
          .unique(async (db, value, field) => {
            return !(await db
              .from('category_post')
              .where('category_id', value)
              .andWhere('post_id', field.meta.post_id)
              .first());
          })
      )
      .optional(),
    categoryUris: vine
      .array(
        vine
          .string()
          .trim()
          .escape()
          .exists(async (db, value) => {
            return !!(await db.from('categories').where('uri', value).first());
          })
          .unique(async (db, value, field) => {
            return !(await db
              .from('category_post')
              .innerJoin('categories', 'categories.id', 'category_post.category_id')
              .where('categories.uri', value)
              .andWhere('post_id', field.meta.post_id)
              .first());
          })
      )
      .optional(),
  })
);

/**
 * If the params.post_id is provided, then the categoryIds must exist in the
 * pivot table. Use {@link categoryDestroyValidator} to validate the params first.
 */
export const categoryIdsDestroyValidator = vine.withMetaData<{ post_id: number }>().compile(
  vine.object({
    categoryIds: vine
      .array(
        vine
          .number()
          .positive()
          .withoutDecimals()
          .exists(async (db, value) => {
            return !!(await db.from('categories').where('id', value).first());
          })
          .exists(async (db, value, field) => {
            return !!(await db
              .from('category_post')
              .where('category_id', value)
              .andWhere('post_id', field.meta.post_id)
              .first());
          })
      )
      .optional(),
    categoryUris: vine
      .array(
        vine
          .string()
          .trim()
          .escape()
          .exists(async (db, value) => {
            return !!(await db.from('categories').where('uri', value).first());
          })
          .exists(async (db, value, field) => {
            return !!(await db
              .from('category_post')
              .innerJoin('categories', 'categories.id', 'category_post.category_id')
              .where('categories.uri', value)
              .where('post_id', field.meta.post_id)
              .first());
          })
      )
      .optional(),
  })
);
