const userActivities = {
	'USER_ADDED': 'USER',
	'USER_REMOVED': 'USER',
	'APP_USER_ADDED': 'USER',
	'APP_USER_REMOVED': 'USER',
	'USER_LOGIN': 'ACCESS',
	'USER_LOGOUT': 'ACCESS',
	'USER_LOGIN_FAILED': 'ACCESS',
	'USER_TOKEN_REFRESH': 'ACCESS',
	'APP_ADMIN_GRANT': 'ADMIN',
	'APP_ADMIN_REVOKE': 'ADMIN',
	'SUPER_ADMIN_GRANT': 'ADMIN',
	'SUPER_ADMIN_REVOKE': 'ADMIN',
	'USER_DETAILS_UPDATE': 'DETAILS',
	'USER_PASSWORD_CHANGE': 'DETAILS',
	'USER_PASSWORD_RESET': 'DETAILS',
	'GROUP_USER_ADDED': 'GROUP',
	'GROUP_USER_REMOVED': 'GROUP',
};

module.exports = { userActivities };