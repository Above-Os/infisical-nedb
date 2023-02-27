import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import {
	License
} from '../../models';
import {
	decryptSymmetric
} from '../../utils/crypto';
import {
	ENCRYPTION_KEY,
	LICENSE_SRV_URL
} from '../../config';
import request from '../../config/request';
import {
	Membership,
	MembershipOrg,
	Organization,
	Workspace,
	IncidentContactOrg
} from '../../models';
import { createOrganization as create } from '../../helpers/organization';
import { addMembershipsOrg } from '../../helpers/membershipOrg';
import { OWNER, ACCEPTED } from '../../variables';
import _ from 'lodash';

export const getOrganizations = async (req: Request, res: Response) => {
	let organizations;
	try {
		organizations = (
			await MembershipOrg.find({
				user: req.user._id
			}).populate('organization')
		).map((m) => m.organization);
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to get organizations'
		});
	}

	return res.status(200).send({
		organizations
	});
};

/**
 * Create new organization named [organizationName]
 * and add user as owner
 * @param req
 * @param res
 * @returns
 */
export const createOrganization = async (req: Request, res: Response) => {
	let organization;
	try {
		const { organizationName } = req.body;

		if (organizationName.length < 1) {
			throw new Error('Organization names must be at least 1-character long');
		}

		// create organization and add user as member
		organization = await create({
			email: req.user.email,
			name: organizationName
		});

		await addMembershipsOrg({
			userIds: [req.user._id.toString()],
			organizationId: organization._id.toString(),
			roles: [OWNER],
			statuses: [ACCEPTED]
		});
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to create organization'
		});
	}

	return res.status(200).send({
		organization
	});
};

/**
 * Return organization with id [organizationId]
 * @param req
 * @param res
 * @returns
 */
export const getOrganization = async (req: Request, res: Response) => {
	let organization;
	try {
		organization = req.membershipOrg.organization;
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to find organization'
		});
	}

	return res.status(200).send({
		organization
	});
};

/**
 * Return organization memberships for organization with id [organizationId]
 * @param req
 * @param res
 * @returns
 */
export const getOrganizationMembers = async (req: Request, res: Response) => {
	let users;
	try {
		const { organizationId } = req.params;

		users = await MembershipOrg.find({
			organization: organizationId
		}).populate('user', '+publicKey');
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to get organization members'
		});
	}

	return res.status(200).send({
		users
	});
};

/**
 * Return workspaces that user is part of in organization with id [organizationId]
 * @param req
 * @param res
 * @returns
 */
export const getOrganizationWorkspaces = async (
	req: Request,
	res: Response
) => {
	let workspaces;
	try {
		const { organizationId } = req.params;

		const workspacesSet = new Set(
			(
				await Workspace.find(
					{
						organization: organizationId
					},
					'_id'
				)
			).map((w) => w._id.toString())
		);

		workspaces = (
			await Membership.find({
				user: req.user._id
			}).populate('workspace')
		)
			.filter((m) => workspacesSet.has(m.workspace._id.toString()))
			.map((m) => m.workspace);
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to get my workspaces'
		});
	}

	return res.status(200).send({
		workspaces
	});
};

/**
 * Change name of organization with id [organizationId] to [name]
 * @param req
 * @param res
 * @returns
 */
export const changeOrganizationName = async (req: Request, res: Response) => {
	let organization;
	try {
		const { organizationId } = req.params;
		const { name } = req.body;

		organization = await Organization.findOneAndUpdate(
			{
				_id: organizationId
			},
			{
				name
			},
			{
				new: true
			}
		);
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to change organization name'
		});
	}

	return res.status(200).send({
		message: 'Successfully changed organization name',
		organization
	});
};

/**
 * Return incident contacts of organization with id [organizationId]
 * @param req
 * @param res
 * @returns
 */
export const getOrganizationIncidentContacts = async (
	req: Request,
	res: Response
) => {
	let incidentContactsOrg;
	try {
		const { organizationId } = req.params;

		incidentContactsOrg = await IncidentContactOrg.find({
			organization: organizationId
		});
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to get organization incident contacts'
		});
	}

	return res.status(200).send({
		incidentContactsOrg
	});
};

/**
 * Add and return new incident contact with email [email] for organization with id [organizationId]
 * @param req
 * @param res
 * @returns
 */
export const addOrganizationIncidentContact = async (
	req: Request,
	res: Response
) => {
	let incidentContactOrg;
	try {
		const { organizationId } = req.params;
		const { email } = req.body;

		incidentContactOrg = await IncidentContactOrg.findOneAndUpdate(
			{ email, organization: organizationId },
			{ email, organization: organizationId },
			{ upsert: true, new: true }
		);
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to add incident contact for organization'
		});
	}

	return res.status(200).send({
		incidentContactOrg
	});
};

/**
 * Delete incident contact with email [email] for organization with id [organizationId]
 * @param req
 * @param res
 * @returns
 */
export const deleteOrganizationIncidentContact = async (
	req: Request,
	res: Response
) => {
	let incidentContactOrg;
	try {
		const { organizationId } = req.params;
		const { email } = req.body;

		incidentContactOrg = await IncidentContactOrg.findOneAndDelete({
			email,
			organization: organizationId
		});
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to delete organization incident contact'
		});
	}

	return res.status(200).send({
		message: 'Successfully deleted organization incident contact',
		incidentContactOrg
	});
};

/**
 * Redirect user to billing portal or add card page depending on
 * if there is a card on file
 * @param req
 * @param res
 * @returns
 */
export const createOrganizationPortalSession = async (
	req: Request,
	res: Response
) => {
	try {
		const license = await License.findOne({
			organization: req.membershipOrg.organization._id,
			type: 'organization'
		});
		
		if (!license) throw new Error('Failed to create organization portal session');
	
		const licenseKey = decryptSymmetric({
			ciphertext: license.licenseKeyCiphertext,
			iv: license.licenseKeyIV,
			tag: license.licenseKeyTag,
			key: ENCRYPTION_KEY
		});
		
		const { data } = await request.get(
			`${LICENSE_SRV_URL}/api/v1/license-key/billing-session`,
			{
				headers: {
					'X-API-KEY': licenseKey,
					'Content-Type': 'application/json'
				}
			}
		);

		return res.status(200).send({
			url: data.url
		});	
	} catch (err) {
		Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
	}

	return res.status(400).send({
		message: 'Failed to redirect to organization billing portal'
	});
};

/**
 * Given a org id, return the projects each member of the org belongs to
 * @param req
 * @param res
 * @returns
 */
export const getOrganizationMembersAndTheirWorkspaces = async (
	req: Request,
	res: Response
) => {
	const { organizationId } = req.params;

	const workspacesSet = (
			await Workspace.find(
				{
					organization: organizationId
				},
				'_id'
			)
		).map((w) => w._id.toString());

	const memberships = (
		await Membership.find({
			workspace: { $in: workspacesSet }
		}).populate('workspace')
	);
	const userToWorkspaceIds: any = {};

	memberships.forEach(membership => {
		const user = membership.user.toString();
		if (userToWorkspaceIds[user]) {
			userToWorkspaceIds[user].push(membership.workspace);
		} else {
			userToWorkspaceIds[user] = [membership.workspace];
		}
	});

	return res.json(userToWorkspaceIds);
};