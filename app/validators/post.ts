import vine from '@vinejs/vine';

export const postIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),
  })
);

export const postStoreValidator = vine.compile(
  vine.object({
    uri: vine
      .string()
      .escape()
      .unique(async (db, value) => {
        return !(await db.from('posts').where('uri', value).first());
      }),
    title: vine.string(),
    description: vine.string().nullable(),
    content: vine.string(),
    userId: vine.number().positive().withoutDecimals().nullable(),
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
