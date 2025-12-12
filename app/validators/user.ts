import vine from '@vinejs/vine';

const userProfile = () =>
  vine.object({
    avatarUri: vine.string().nullable().optional(),
    bio: vine.string().nullable().optional(),
  });

export const userIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),
    withPosts: vine.boolean().optional(),
    hasPosts: vine.boolean().optional(),
    email: vine.string().trim().ascii().escape().maxLength(254).optional(),
    fullName: vine.string().trim().ascii().escape().optional(),
  })
);

export const userStoreValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .maxLength(254)
      .email()
      .unique(async (db, value) => {
        return !(await db.from('users').where('email', value).first());
      }),
    password: vine.string().minLength(6),
    fullName: vine.string().nullable().optional(),
    profile: userProfile().optional(),
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
          return !!(await db.from('users').where('id', value).first());
        }),
    }),
  })
);

export const userUpdateValidator = vine.withMetaData<{ id: number }>().compile(
  vine.object({
    email: vine
      .string()
      .maxLength(254)
      .email()
      .unique(async (db, value, field) => {
        return !(await db
          .from('users')
          .where('email', value)
          .whereNot('id', field.meta.id)
          .first());
      }),
    password: vine.string().minLength(6).optional(),
    fullName: vine.string().nullable().optional(),
    profile: userProfile().optional(),
  })
);
