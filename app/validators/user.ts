import vine from '@vinejs/vine';

export const userIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),
  })
);

export const userStoreValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first();
        return !user;
      }),
    password: vine.string().minLength(6),
    fullName: vine.string().nullable().optional(),
  })
);

export const userShowValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .positive()
        .withoutDecimals()
        .exists(async (db, value) => {
          const user = await db.from('users').where('id', value).first();
          return !!user;
        }),
    }),
  })
);

export const userUpdateValidator = vine.withMetaData<{ id: number }>().compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .where('email', value)
          .whereNot('id', field.meta.id)
          .first();
        return !user;
      }),
    password: vine.string().minLength(6).optional(),
    fullName: vine.string().nullable().optional(),
  })
);
