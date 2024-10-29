import vine from '@vinejs/vine';

export const categoryIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),
  })
);

export const categoryStoreValidator = vine.compile(
  vine.object({
    uri: vine
      .string()
      .escape()
      .unique(async (db, value) => {
        return !(await db.from('categories').where('uri', value).first());
      }),
    name: vine.string(),
    description: vine.string().nullable(),
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
