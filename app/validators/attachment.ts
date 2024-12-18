import vine from '@vinejs/vine';

export const attachmentIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),
    withPosts: vine.boolean().optional(),
    hasPosts: vine.boolean().optional(),
    ext: vine.string().trim().ascii().escape().optional(),
    path: vine.string().trim().ascii().escape().optional(),
    title: vine.string().optional(),

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

export const attachmentStoreValidator = vine.compile(
  vine.object({
    ext: vine.string().trim().ascii().escape().optional().requiredIfMissing('params.post_id'),
    path: vine
      .string()
      .trim()
      .ascii()
      .escape()
      .unique(async (db, value) => {
        return !(await db.from('attachments').where('path', value).first());
      })
      .optional()
      .requiredIfMissing('params.post_id'),
    size: vine.number().positive().withoutDecimals().optional().requiredIfMissing('params.post_id'),
    title: vine.string().optional(),

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

export const attachmentShowValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('attachments').where('id', value).first());
        }),
    }),
  })
);

export const attachmentUpdateValidator = vine.withMetaData<{ id: number }>().compile(
  vine.object({
    ext: vine.string().trim().ascii().escape().optional(),
    path: vine
      .string()
      .trim()
      .ascii()
      .escape()
      .unique(async (db, value, field) => {
        return !(await db
          .from('attachments')
          .where('path', value)
          .whereNot('id', field.meta.id)
          .first());
      }),
    size: vine.number().positive().withoutDecimals().optional(),
    title: vine.string().optional(),
  })
);

export const attachmentDestroyValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          return !!(await db.from('attachments').where('id', value).first());
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
 * If the params.post_id is provided, then the attachmentIds must be provided and
 * the items must exist in the pivot table. Use {@link attachmentIdsStoreValidator}
 * to validate the params first.
 */
export const attachmentIdsStoreValidator = vine.withMetaData<{ post_id: number }>().compile(
  vine.object({
    attachmentIds: vine
      .array(
        vine
          .number()
          .positive()
          .withoutDecimals()
          .exists(async (db, value) => {
            return !!(await db.from('attachments').where('id', value).first());
          })
          .unique(async (db, value, field) => {
            return !(await db
              .from('attachment_post')
              .where('attachment_id', value)
              .andWhere('post_id', field.meta.post_id)
              .first());
          })
      )
      .optional(),
  })
);

/**
 * If the params.post_id is provided, then the attachmentIds must exist in the
 * pivot table. Use {@link attachmentDestroyValidator} to validate the params first.
 */
export const attachmentIdsDestroyValidator = vine.withMetaData<{ post_id: number }>().compile(
  vine.object({
    attachmentIds: vine
      .array(
        vine
          .number()
          .positive()
          .withoutDecimals()
          .exists(async (db, value) => {
            return !!(await db.from('attachments').where('id', value).first());
          })
          .exists(async (db, value, field) => {
            return !!(await db
              .from('attachment_post')
              .where('attachment_id', value)
              .andWhere('post_id', field.meta.post_id)
              .first());
          })
      )
      .optional(),
  })
);
