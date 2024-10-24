import vine from '@vinejs/vine';

export const authRegisterValidator = vine.compile(
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

export const authLoginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(6),
  })
);
