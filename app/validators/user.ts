import vine from '@vinejs/vine';

export const userIndexValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
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
    fullName: vine.string(),
  })
);

export const userShowValidator = vine.compile(
  vine.object({
    id: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const user = await db.from('users').where('id', value).first();
        return !!user;
      }),
  })
);

export const userUpdateValidator = vine.withMetaData<{ id: number }>().compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value, { meta }) => {
        const user = await db.from('users').where('email', value).whereNot('id', meta.id).first();
        return !user;
      }),
    password: vine.string().minLength(6).optional(),
    fullName: vine.string().optional(),
  })
);
