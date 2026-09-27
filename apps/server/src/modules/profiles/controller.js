// @ts-check
import {
  MyProfileResponseSchema,
  ProfileOptionsResponseSchema,
  PublicProfileResponseSchema,
  SettingsResponseSchema,
} from '@campus/shared';
import { sendPresented } from '../../http/respond.js';
import { requireAuth } from '../../middleware/authenticate.js';
import * as service from './service.js';

/**
 * HTTP <-> service translation only, per docs/conventions.md "Layering".
 * Every response goes through `sendPresented` (§11.5 lock 3) with the
 * DTO's own shared response schema.
 */

/** @type {import('express').RequestHandler} */
export const getProfileOptions = async (req, res) => {
  const auth = requireAuth(res);
  const data = await service.getProfileOptions({
    userId: auth.userId,
    universityId: auth.universityId,
  });
  sendPresented(res, ProfileOptionsResponseSchema, data);
};

/**
 * @typedef {Object} ProfileCreateBody
 * @property {string} selectedName
 * @property {string} avatarColor
 * @property {true} acceptedGuidelines
 * @property {string} [departmentId]
 * @property {number} [semester]
 * @property {string[]} [interestIds]
 */

/** @type {import('express').RequestHandler} */
export const createProfile = async (req, res) => {
  const auth = requireAuth(res);
  const body = /** @type {ProfileCreateBody} */ (req.body);
  const data = await service.createProfile({
    userId: auth.userId,
    universityId: auth.universityId,
    selectedName: body.selectedName,
    avatarColor: body.avatarColor,
    departmentId: body.departmentId,
    semester: body.semester,
    interestIds: body.interestIds,
  });
  sendPresented(res, MyProfileResponseSchema, data, { status: 201 });
};

/** @type {import('express').RequestHandler} */
export const updateProfile = async (req, res) => {
  const auth = requireAuth(res);
  const data = await service.updateProfile({
    userId: auth.userId,
    universityId: auth.universityId,
    patch: /** @type {Record<string, unknown>} */ (req.body),
  });
  sendPresented(res, MyProfileResponseSchema, data);
};

/** @type {import('express').RequestHandler} */
export const renameProfile = async (req, res) => {
  const auth = requireAuth(res);
  const { selectedName, avatarColor } =
    /** @type {{ selectedName: string, avatarColor: string }} */ (req.body);
  const data = await service.renameProfile({ userId: auth.userId, selectedName, avatarColor });
  sendPresented(res, MyProfileResponseSchema, data);
};

/** @type {import('express').RequestHandler} */
export const replaceInterests = async (req, res) => {
  const auth = requireAuth(res);
  const { interestIds } = /** @type {{ interestIds: string[] }} */ (req.body);
  const data = await service.replaceInterests({ userId: auth.userId, interestIds });
  sendPresented(res, MyProfileResponseSchema, data);
};

/** @type {import('express').RequestHandler} */
export const getMyProfile = async (req, res) => {
  const auth = requireAuth(res);
  const data = await service.getMyProfile({ userId: auth.userId });
  sendPresented(res, MyProfileResponseSchema, data);
};

/** @type {import('express').RequestHandler} */
export const getPublicProfile = async (req, res) => {
  const auth = requireAuth(res);
  const { publicId } = /** @type {{ publicId: string }} */ (req.params);
  const data = await service.getPublicProfile({ publicId, viewerUniversityId: auth.universityId });
  sendPresented(res, PublicProfileResponseSchema, data);
};

/** @type {import('express').RequestHandler} */
export const getSettings = async (req, res) => {
  const auth = requireAuth(res);
  const data = await service.getSettings({ userId: auth.userId });
  sendPresented(res, SettingsResponseSchema, data);
};

/** @type {import('express').RequestHandler} */
export const updateSettings = async (req, res) => {
  const auth = requireAuth(res);
  const data = await service.updateSettings({
    userId: auth.userId,
    patch: /** @type {Record<string, unknown>} */ (req.body),
  });
  sendPresented(res, SettingsResponseSchema, data);
};
