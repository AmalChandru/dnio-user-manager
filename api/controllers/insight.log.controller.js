'use strict';
let queueMgmt = require('../../util/queueMgmt');
const _ = require('lodash');
var client = queueMgmt.client;
var queue = 'user-insight';
const mongoose = require('mongoose');
let logger = global.logger;
const { userActivities } = require('./../../config/userInsights');


let e = {};

e.login = async (data, req, res) => {
	var body = makeBody(data, req, res, 'USER_LOGIN');
	body.data.summary = data.username + ' logged in';
	try {
		let apps = await getUserApps(data._id);
		apps.forEach(app => {
			let message = _.cloneDeep(body.data);
			message.app = app;
			client.publish(queue, JSON.stringify(message));
		});
	} catch (e) {
		logger.error('Error in publishing login messages :', e);
	}
};

e.loginFailed = async (data, req, res) => {
	if (data != null) {
		var body = makeBody(data, req, res, 'USER_LOGIN_FAILED');
		body.data.summary = 'Login failed for ' + data.username;
		try {
			let apps = await getUserApps(data._id);
			apps.forEach(app => {
				let message = _.cloneDeep(body.data);
				message.app = app;
				client.publish(queue, JSON.stringify(message));
			});
		} catch (e) {
			logger.error('Error in publishing login failure messages :', e);
		}
	} else {
		return res.status(404).json({
			message: 'username does not exists'
		});
	}
};

e.logout = async (data, req, res) => {
	var body = makeBody(data, req, res, 'USER_LOGOUT');
	body.data.summary = data.username + ' logged out';
	try {
		let apps = await getUserApps(data._id);
		apps.forEach(app => {
			let message = _.cloneDeep(body.data);
			message.app = app;
			client.publish(queue, JSON.stringify(message));
		});
	} catch (e) {
		logger.error('Error in publishing logout messages :', e);
	}
};

function makeBody(data, req, res, activityCode) {
	let headers = JSON.parse(JSON.stringify(req.headers));
	// For login api headers.user would be undefined
	let user = headers.user != 'null' ? headers.user : data._id;
	let body = {
		data: {
			userId: user,
			txnid: headers.txnid,
			resStatusCode: res.statusCode,
			_metadata: {
				'deleted': false,
				'createdAt': new Date(),
				'lastUpdated': new Date()
			},
			activityCode: activityCode,
			activityType: userActivities[activityCode]
		}
	};
	// if (data) {
	// 	body.data.apps = data.apps;
	// }
	return body;
}

e.refreshToken = async (data, req, res) => {
	var body = makeBody(data, req, res, 'USER_TOKEN_REFRESH');
	body.data.summary = data.username + ' refreshed token';
	try {
		let apps = await getUserApps(data._id);
		apps.forEach(app => {
			let message = _.cloneDeep(body.data);
			message.app = app;
			client.publish(queue, JSON.stringify(message));
		});
	} catch (e) {
		logger.error('Error in publishing tokenm refresh messages :', e);
	}
};

e.addUserToApp = (req, res, data) => {
	var body = makeBody(null, req, res, 'APP_USER_ADDED');
	body.data.app = req.swagger.params.app.value;
	body.data.summary = req.user.username + ' added a new user ' + data.username;
	client.publish(queue, JSON.stringify(body.data));
};


// TODO
e.removeUser = (req, res, data) => {
	let apps = [];
	return mongoose.model('group').find({
		'users': req.user.id
	}, 'app')
		.then(_grps => {
			apps = _grps.map(_g => _g.app);
			for (let i = 0; i < data.app.length; i++) {
				apps.push(data.app[i]);
			}
			apps = _.uniq(apps);
		})
		.then(() => {
			var body = makeBody(null, req, res, 'APP_USER_REMOVED');
			body.data.apps = apps;
			body.data.summary = req.user.username + ' deleted user ' + data.username;
			client.publish(queue, JSON.stringify(body.data));
		});
};


// TBD - REALLY REQUIRED??
// e.changePassword = (req, res) => {
// 	let apps = [];
// 	return mongoose.model('group').find({
// 		'users': req.user.id
// 	}, 'app')
// 		.then(_grps => {
// 			apps = _grps.map(_g => _g.app);
// 			apps = _.uniq(apps);
// 		})
// 		.then(() => {
// 			var body = makeBody(null, req, res, 'USER_PASSWORD_CHANGE');
// 			body.data.apps = apps;
// 			body.data.summary = req.user.username + ' changed password';
// 			client.publish(queue, JSON.stringify(body.data));
// 		});
// };

e.superAdminAccess = (req, res, action, data) => {
	let activityCode;
	if (action == 'revoke')
		activityCode = 'SUPER_ADMIN_REVOKE';
	else if (action == 'grant')
		activityCode = 'SUPER_ADMIN_GRANT';
	var body = makeBody(null, req, res, activityCode);
	body.data.app = null;
	if (action == 'revoke') {
		body.data.summary = req.user.username + ' removed ' + data.username + ' as super admin';
	} else if (action == 'grant') {
		body.data.summary = req.user.username + ' made ' + data.username + ' as super admin';
	}
	client.publish(queue, JSON.stringify(body.data));
};

e.appAdminAccess = (req, res, action, data, apps) => {
	let activityCode;
	if (action == 'revoke')
		activityCode = 'APP_ADMIN_REVOKE';
	else if (action == 'grant')
		activityCode = 'APP_ADMIN_GRANT';
	var body = makeBody(null, req, res, activityCode);
	apps.forEach(app => {
		let message = _.cloneDeep(body.data);
		if (action == 'revoke') {
			message.summary = req.user.username + ' removed ' + data.username + ' app admin of App ' + app;
		} else if (action == 'grant') {
			message.summary = req.user.username + ' made ' + data.username + ' app admin of App ' + app;
		}
		message.app = app;
		client.publish(queue, JSON.stringify(message));
	});
};


e.resetPassword = async (data, req, res) => {
	var body = makeBody(data, req, res, 'USER_PASSWORD_RESET');
	body.data.summary = req.user.username + ' reset the password for user ' + data.username;
	try {
		let apps = await getUserApps(data._id);
		apps.forEach(app => {
			let message = _.cloneDeep(body.data);
			message.app = app;
			client.publish(queue, JSON.stringify(message));
		});
	} catch (e) {
		logger.error('Error in publishing resetPassword messages :', e);
	}
};

e.userAddedInTeam = (req, res, data, groups) => {
	var body = makeBody(null, req, res, 'GROUP_USER_ADDED');
	groups.forEach(grp => {
		let message = _.cloneDeep(body.data);
		message.app = grp.app;
		body.data.summary = req.user.username + ' added ' + data.username + ' to group ' + grp.name;
		client.publish(queue, JSON.stringify(message));
	});
};

e.userRemovedFromTeam = (req, res, groups, userId) => {
	var body = makeBody(null, req, res, 'GROUP_USER_REMOVED');
	groups.forEach(grp => {
		let message = _.cloneDeep(body.data);
		message.app = grp.app;
		body.data.summary = req.user.username + ' removed ' + userId + ' from group ' + grp.name;
		client.publish(queue, JSON.stringify(message));
	});
};

e.updateUser = () => {
	let body = {};
	return function (doc) {
		if (doc._auditData) {
			let oldBasicDetails = null;
			let newBasicDetails = doc.basicDetails;
			if (doc._auditData.data && doc._auditData.data.old) {
				oldBasicDetails = doc._auditData.data.old.basicDetails;
			}
			if (doc.basicDetails && doc._auditData.data && doc._auditData.data.old && doc._auditData.data.old.basicDetails && (oldBasicDetails.name != newBasicDetails.name || oldBasicDetails.phone != newBasicDetails.phone || oldBasicDetails.alternateEmail != newBasicDetails.alternateEmail)) {
				body = {
					data: {
						userId: doc._auditData.user,
						txnid: doc._auditData.txnId,
						resStatusCode: 200,
						_metadata: {
							'deleted': false,
							'createdAt': new Date(),
							'lastUpdated': new Date()
						},
						activityCode: 'USER_DETAILS_UPDATE',
						activityType: userActivities['USER_DETAILS_UPDATE']
					}
				};
				return getUserApps(doc._auditData.data.old._id).then(apps => {
					body.data.summary = makeUpdatemsg(doc._auditData.data.old._id, doc._auditData.user, doc.basicDetails, doc._auditData.data.old.basicDetails);
					apps.forEach(app => {
						let message = _.cloneDeep(body.data);
						message.app = app;
						client.publish(queue, JSON.stringify(message));
					});
				});
			}
		}
	};
};

e.createUser = () => {
	let mainUser = null;
	let normalUser = null;
	let body = {};
	return function (doc) {
		try {
			if (doc._auditData && doc._auditData.user) {
				if (doc._auditData.data && (doc._auditData.data.old == null || isEmpty(doc._auditData.data.old))) {
					body = {
						data: {
							userId: doc._auditData.user,
							txnid: doc._auditData.txnId,
							resStatusCode: 200,
							_metadata: {
								'deleted': false,
								'createdAt': new Date(),
								'lastUpdated': new Date()
							},
							activityCode: 'USER_ADDED',
							activityType: userActivities['USER_ADDED']
						}
					};
					body.data.app = null;
					body.data.summary = mainUser + ' added a new user ' + normalUser;
					client.publish(queue, JSON.stringify(body.data));
				}
			}
		} catch (err) {
			logger.error(err);
		}

	};
};

e.removeUsers = () => {
	let mainUser = null;
	let normalUser = null;
	let body = {};
	return function (doc) {
		try {
			if (doc._auditData) {
				if (doc._auditData.data && (doc._auditData.data.new == null || isEmpty(doc._auditData.data.new))) {
					body = {
						data: {
							userId: doc._auditData.user,
							txnid: doc._auditData.txnId,
							resStatusCode: 200,
							_metadata: {
								'deleted': false,
								'createdAt': new Date(),
								'lastUpdated': new Date()
							},
							activityCode: 'USER_REMOVED',
							activityType: userActivities['USER_REMOVED']
						}
					};
					return getUserApps(doc.username)
						.then(apps => {
							mainUser = doc._auditData.user;
							normalUser = doc.username;
							body.data.summary = mainUser + ' deleted user ' + normalUser;
							// To have one log at admin panel level as well
							apps.push(null);
							apps.forEach(app => {
								let message = _.cloneDeep(body.data);
								message.app = app;
								client.publish(queue, JSON.stringify(message));
							});
						});
				}
			}
		} catch (err) {
			logger.error(err);
		}
	};
};

function makeUpdatemsg(user1, user2, newMsg, oldMsg) {
	let message = null;
	let actions = [];
	let oldValue = [];
	let newValue = [];
	if (newMsg.alternateEmail != oldMsg.alternateEmail) {
		actions.push('email');
		oldValue.push(oldMsg.alternateEmail);
		newValue.push(newMsg.alternateEmail);
	}
	if (newMsg.name != oldMsg.name) {
		actions.push('name');
		oldValue.push(oldMsg.name);
		newValue.push(newMsg.name);
	}
	if (newMsg.phone != oldMsg.phone) {
		actions.push('phone');
		oldValue.push(oldMsg.phone);
		newValue.push(newMsg.phone);
	}
	if (user1 != user2) {
		message = user2 + ' updated ' + actions + ' of user ' + user1 + ' from ' + oldValue + ' to ' + newValue;
	} else {
		message = user2 + ' updated ' + actions + ' from ' + oldValue + ' to ' + newValue;
	}
	return message;
}

// function getUserDetails(userId) {
// 	return mongoose.model('user').findOne({
// 		_id: userId
// 	});
// }

function isEmpty(obj) {
	return Object.keys(obj).length === 0;
}

function getUserApps(userId) {
	logger.trace('Getting apps for user ', userId);
	return mongoose.model('group').aggregate([{
		'$match': {
			'users': userId
		}
	}, {
		'$group': {
			'_id': '$app'
		}
	}, {
		'$group': {
			'_id': null,
			'apps': {
				'$addToSet': '$_id'
			}
		}
	}]).then(appData => appData.apps)
		.catch(err => {
			logger.error('Error in getUserApps :: ', err);
			throw err;
		});
}

module.exports = e;