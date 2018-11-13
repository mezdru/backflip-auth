define({ "api": [
  {
    "type": "post",
    "url": "/authorization/organisation/:orgTag/:invitationCode?",
    "title": "Register a new User in Organisation",
    "name": "RegisterUserInOrg",
    "group": "Organisation",
    "version": "1.0.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>User 'Bearer access_token'</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "orgTag",
            "description": "<p>Organisation tag</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "invitationCode",
            "description": "<p>Invitation code (optionnal)</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>User registered in organisation. OR User already registered in Organisation.</p>"
          },
          {
            "group": "Success 200",
            "type": "User",
            "optional": false,
            "field": "user",
            "description": "<p>User object</p>"
          },
          {
            "group": "Success 200",
            "type": "Organisation",
            "optional": false,
            "field": "organisation",
            "description": "<p>Organisation object</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "500 Internal Server Error": [
          {
            "group": "500 Internal Server Error",
            "optional": false,
            "field": "InternalError",
            "description": "<p>Internal error</p>"
          }
        ],
        "404 Not Found": [
          {
            "group": "404 Not Found",
            "optional": false,
            "field": "OrganisationNotFound",
            "description": "<p>Organisation not found.</p>"
          }
        ],
        "403 Forbidden": [
          {
            "group": "403 Forbidden",
            "optional": false,
            "field": "InvitationExpired",
            "description": "<p>Invitation expired</p>"
          },
          {
            "group": "403 Forbidden",
            "optional": false,
            "field": "UserForbidden",
            "description": "<p>User can't access the Organisation.</p>"
          }
        ]
      }
    },
    "filename": "api/authorization/authorization.js",
    "groupTitle": "Organisation"
  },
  {
    "type": "post",
    "url": "/register",
    "title": "Register a new User",
    "name": "RegisterUser",
    "group": "User",
    "version": "1.0.0",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email of the User</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>Password of the User</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>User created with success.</p>"
          },
          {
            "group": "Success 200",
            "type": "User",
            "optional": false,
            "field": "user",
            "description": "<p>User object</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "500 Internal Server Error": [
          {
            "group": "500 Internal Server Error",
            "optional": false,
            "field": "InternalError",
            "description": "<p>Internal error</p>"
          }
        ],
        "400 Bad Request": [
          {
            "group": "400 Bad Request",
            "optional": false,
            "field": "BadRequest",
            "description": "<p>Missing parameters OR User exists already</p>"
          }
        ],
        "422 Invalid Parameters": [
          {
            "group": "422 Invalid Parameters",
            "optional": false,
            "field": "InvalidParameters",
            "description": "<p>Invalid parameters OR Invalid password</p>"
          }
        ]
      }
    },
    "filename": "api/register/register.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/auth/locale",
    "title": "Authentify an User",
    "name": "UserAuthentication",
    "group": "User",
    "version": "1.0.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>User email</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>User password</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "grant_type",
            "description": "<p>Access type, currently 'password'</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "client_secret",
            "description": "<p>Client secret</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "client_id",
            "description": "<p>Client id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "access_token",
            "description": "<p>Access token of the User</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "refresh_token",
            "description": "<p>Refresh token of the User</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "expires_in",
            "description": "<p>Timeout of the access token of the User</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "token_type",
            "description": "<p>Token type, used for authentication</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "500 Internal Server Error": [
          {
            "group": "500 Internal Server Error",
            "optional": false,
            "field": "InternalError",
            "description": "<p>Internal error</p>"
          }
        ],
        "403 Forbidden": [
          {
            "group": "403 Forbidden",
            "optional": false,
            "field": "InvalidGrant",
            "description": "<p>Invalid resource owner credentials</p>"
          }
        ],
        "401 Unauthorized": [
          {
            "group": "401 Unauthorized",
            "optional": false,
            "field": "UnauthorizedClient",
            "description": "<p>Client id or secret invalid</p>"
          }
        ]
      }
    },
    "filename": "api/auth/oauth2.js",
    "groupTitle": "User"
  }
] });
