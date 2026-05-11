/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/synapse.json`.
 */
export type Synapse = {
  "address": "eCv677gAYX6ptLtJrPv9Rj8C4eGA4c9ecswRT5QJbeG",
  "metadata": {
    "name": "synapse",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeSession",
      "discriminator": [
        68,
        114,
        178,
        140,
        222,
        38,
        248,
        211
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true
        },
        {
          "name": "initiator",
          "signer": true,
          "relations": [
            "session"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "configureAgent",
      "discriminator": [
        185,
        111,
        49,
        42,
        77,
        47,
        113,
        107
      ],
      "accounts": [
        {
          "name": "agentRegistry",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "agentRegistry"
          ]
        }
      ],
      "args": [
        {
          "name": "acceptList",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "isOpen",
          "type": "bool"
        },
        {
          "name": "category",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "capabilities",
          "type": {
            "option": {
              "vec": "string"
            }
          }
        }
      ]
    },
    {
      "name": "createSession",
      "discriminator": [
        242,
        193,
        143,
        179,
        150,
        25,
        122,
        227
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "initiator"
              },
              {
                "kind": "account",
                "path": "responder"
              },
              {
                "kind": "arg",
                "path": "timestamp"
              }
            ]
          }
        },
        {
          "name": "initiator",
          "writable": true,
          "signer": true
        },
        {
          "name": "responder"
        },
        {
          "name": "responderRegistry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "responderAlias"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "timestamp",
          "type": "u64"
        },
        {
          "name": "encryptedOffer",
          "type": "bytes"
        },
        {
          "name": "responderAlias",
          "type": "string"
        }
      ]
    },
    {
      "name": "expireSession",
      "discriminator": [
        102,
        173,
        129,
        188,
        181,
        251,
        173,
        72
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true
        },
        {
          "name": "initiator",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "registerAgent",
      "discriminator": [
        135,
        157,
        66,
        195,
        2,
        113,
        175,
        30
      ],
      "accounts": [
        {
          "name": "agentRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "alias"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "alias",
          "type": "string"
        },
        {
          "name": "category",
          "type": "string"
        },
        {
          "name": "capabilities",
          "type": {
            "vec": "string"
          }
        }
      ]
    },
    {
      "name": "respondSession",
      "discriminator": [
        106,
        201,
        22,
        84,
        149,
        147,
        182,
        128
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true
        },
        {
          "name": "responder",
          "signer": true,
          "relations": [
            "session"
          ]
        }
      ],
      "args": [
        {
          "name": "encryptedAnswer",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "agentRegistry",
      "discriminator": [
        6,
        34,
        128,
        124,
        33,
        136,
        199,
        171
      ]
    },
    {
      "name": "session",
      "discriminator": [
        243,
        81,
        72,
        115,
        214,
        188,
        72,
        144
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "aliasTooLong",
      "msg": "Alias is too long. Maximum 32 characters."
    },
    {
      "code": 6001,
      "name": "categoryTooLong",
      "msg": "Category is too long. Maximum 32 characters."
    },
    {
      "code": 6002,
      "name": "invalidSessionStatus",
      "msg": "Session is not in pending status."
    },
    {
      "code": 6003,
      "name": "sessionExpired",
      "msg": "Session has expired."
    },
    {
      "code": 6004,
      "name": "sessionNotExpired",
      "msg": "Session has not expired yet."
    },
    {
      "code": 6005,
      "name": "unauthorizedInitiator",
      "msg": "Initiator is not authorized to connect to this agent."
    }
  ],
  "types": [
    {
      "name": "agentRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "alias",
            "type": "string"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "capabilities",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "acceptList",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "isOpen",
            "type": "bool"
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "session",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initiator",
            "type": "pubkey"
          },
          {
            "name": "responder",
            "type": "pubkey"
          },
          {
            "name": "encryptedOffer",
            "type": "bytes"
          },
          {
            "name": "encryptedAnswer",
            "type": {
              "option": "bytes"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "sessionStatus"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sessionStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "closed"
          }
        ]
      }
    }
  ]
};
