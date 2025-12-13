import { test } from '@japa/runner';
import testUtils from '@adonisjs/core/services/test_utils';
import { UserFactory } from '#database/factories/user_factory';
import { CategoryFactory } from '#database/factories/category_factory';
import User from '#models/user';

test.group('Categories update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test('should update category with valid data', async ({ client, assert }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();

    const response = await client
      .put(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'updated-uri',
        name: 'Updated Name',
        description: 'Updated description',
      });

    response.assertStatus(200);
    response.assertBodyContains({
      id: category.id,
      uri: 'updated-uri',
      name: 'Updated Name',
      description: 'Updated description',
    });

    await category.refresh();
    assert.equal(category.uri, 'updated-uri');
    assert.equal(category.name, 'Updated Name');
    assert.equal(category.description, 'Updated description');
  });

  test('should update category with null description', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.merge({
      description: 'Original description',
    }).create();

    const response = await client
      .put(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: category.uri,
        name: category.name,
        description: null,
      });

    response.assertStatus(200);
    response.assertBodyContains({
      description: null,
    });
  });

  test('should fail to update category without authentication', async ({ client }) => {
    const category = await CategoryFactory.create();

    const response = await client.put(`/v1/categories/${category.id}`).json({
      uri: 'new-uri',
      name: 'New Name',
      description: null,
    });

    response.assertStatus(401);
  });

  test('should fail to update category with duplicate uri', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    await CategoryFactory.merge({ uri: 'existing-uri' }).create();
    const category2 = await CategoryFactory.merge({ uri: 'other-uri' }).create();

    const response = await client
      .put(`/v1/categories/${category2.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'existing-uri',
        name: 'Some Name',
        description: null,
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'uri', rule: 'database.unique' }],
    });
  });

  test('should allow updating category with same uri', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.merge({
      uri: 'test-uri',
      name: 'Original Name',
    }).create();

    const response = await client
      .put(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'test-uri',
        name: 'Updated Name',
        description: null,
      });

    response.assertStatus(200);
    response.assertBodyContains({
      uri: 'test-uri',
      name: 'Updated Name',
    });
  });

  test('should fail to update non-existent category', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .put('/v1/categories/999999')
      .bearerToken(token.value!.release())
      .json({
        uri: 'new-uri',
        name: 'New Name',
        description: null,
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'database.exists' }],
    });
  });

  test('should fail to update category with negative id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .put('/v1/categories/-1')
      .bearerToken(token.value!.release())
      .json({
        uri: 'new-uri',
        name: 'New Name',
        description: null,
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'positive' }],
    });
  });

  test('should fail to update category with decimal id', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);

    const response = await client
      .put('/v1/categories/1.5')
      .bearerToken(token.value!.release())
      .json({
        uri: 'new-uri',
        name: 'New Name',
        description: null,
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'params.id', rule: 'withoutDecimals' }],
    });
  });

  test('should fail to update category without uri', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();

    const response = await client
      .put(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release())
      .json({
        name: 'New Name',
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'uri', rule: 'required' }],
    });
  });

  test('should fail to update category without name', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();

    const response = await client
      .put(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'new-uri',
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'name', rule: 'required' }],
    });
  });

  test('should fail to update category with invalid uri format', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();

    const response = await client
      .put(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'Invalid URI!',
        name: 'New Name',
        description: null,
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'uri', rule: 'alphaNumeric' }],
    });
  });

  test('should fail to update category with empty name', async ({ client }) => {
    const user = await UserFactory.create();
    const token = await User.accessTokens.create(user);
    const category = await CategoryFactory.create();

    const response = await client
      .put(`/v1/categories/${category.id}`)
      .bearerToken(token.value!.release())
      .json({
        uri: 'new-uri',
        name: '',
        description: null,
      });

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [{ field: 'name', rule: 'required' }],
    });
  });
});
