import vine from '@vinejs/vine';

const settingGroup = () =>
  vine.string().trim().alphaNumeric({ allowDashes: true, allowUnderscores: true });
const settingKey = () =>
  vine.string().trim().alphaNumeric({ allowDashes: true, allowUnderscores: true });

export const settingIndexValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    perPage: vine.number().positive().withoutDecimals().max(100).optional(),
    group: vine.string().trim().ascii().escape().maxLength(255).optional(),
    key: vine.string().trim().ascii().escape().maxLength(255).optional(),
  })
);

export const settingStoreValidator = vine.compile(
  vine.object({
    group: settingGroup().startsWith('client-').optional(),
    key: settingKey().unique(async (db, value) => {
      return !(await db.from('settings').where('key', value).first());
    }),
    value: vine.string().nullable(),
  })
);

export const settingShowValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: settingKey().exists(async (db, value) => {
        return !!(await db.from('settings').where('key', value).first());
      }),
    }),
  })
);

export const settingUpdateValidator = vine.compile(
  vine.object({
    group: settingGroup().startsWith('client-').optional(),
    value: vine.string().nullable().optional(),
  })
);
