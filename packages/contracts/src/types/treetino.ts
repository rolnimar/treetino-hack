/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/treetino.json`.
 */
export type Treetino = {
  "address": "EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n",
  "metadata": {
    "name": "treetino",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Treetino energy ownership protocol"
  },
  "instructions": [
    {
      "name": "activateTree",
      "discriminator": [
        178,
        137,
        253,
        31,
        158,
        231,
        129,
        239
      ],
      "accounts": [
        {
          "name": "creator",
          "signer": true,
          "relations": [
            "tree"
          ]
        },
        {
          "name": "tree",
          "writable": true
        },
        {
          "name": "shareMint",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "firstDayStartTs",
          "type": "i64"
        }
      ]
    },
    {
      "name": "buyShares",
      "discriminator": [
        40,
        239,
        138,
        154,
        8,
        37,
        106,
        108
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "tree",
          "writable": true
        },
        {
          "name": "shareMint",
          "writable": true
        },
        {
          "name": "fundingTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              }
            ]
          }
        },
        {
          "name": "paymentTokenAccount",
          "writable": true
        },
        {
          "name": "shareTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "shareMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimRewards",
      "discriminator": [
        4,
        144,
        132,
        71,
        116,
        23,
        151,
        80
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "tree",
          "writable": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "revenueTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  101,
                  110,
                  117,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              }
            ]
          }
        },
        {
          "name": "paymentTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "giveMeMoney",
      "discriminator": [
        170,
        166,
        186,
        227,
        192,
        181,
        18,
        150
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "paymentMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "paymentTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initAdmins",
      "discriminator": [
        167,
        72,
        158,
        202,
        115,
        142,
        106,
        3
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "program",
          "address": "EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n"
        },
        {
          "name": "programData"
        },
        {
          "name": "adminConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  115
                ]
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
          "name": "admins",
          "type": {
            "vec": "pubkey"
          }
        }
      ]
    },
    {
      "name": "initPaymentToken",
      "discriminator": [
        101,
        165,
        178,
        228,
        15,
        115,
        178,
        134
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "paymentMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "paymentMetadata",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "metadataProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "account",
              "path": "metadataProgram"
            }
          }
        },
        {
          "name": "metadataProgram",
          "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initTree",
      "discriminator": [
        84,
        43,
        152,
        222,
        125,
        95,
        199,
        217
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "adminConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "tree",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "treeId"
              }
            ]
          }
        },
        {
          "name": "paymentMint",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "shareMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  97,
                  114,
                  101,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              }
            ]
          }
        },
        {
          "name": "fundingTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              }
            ]
          }
        },
        {
          "name": "revenueTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  101,
                  110,
                  117,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "treeId",
          "type": "u64"
        },
        {
          "name": "target",
          "type": "u64"
        },
        {
          "name": "supplier",
          "type": "pubkey"
        },
        {
          "name": "client",
          "type": "pubkey"
        },
        {
          "name": "reporter",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "issueInvoice",
      "discriminator": [
        159,
        194,
        249,
        111,
        13,
        163,
        231,
        132
      ],
      "accounts": [
        {
          "name": "creator",
          "docs": [
            "Backend uses the tree creator's key as the billing authority in this MVP."
          ],
          "signer": true,
          "relations": [
            "tree"
          ]
        },
        {
          "name": "tree",
          "writable": true,
          "relations": [
            "report"
          ]
        },
        {
          "name": "report",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              },
              {
                "kind": "account",
                "path": "report.dayStartTs",
                "account": "report"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "payInvoice",
      "discriminator": [
        104,
        6,
        62,
        239,
        197,
        206,
        208,
        220
      ],
      "accounts": [
        {
          "name": "client",
          "signer": true,
          "relations": [
            "tree"
          ]
        },
        {
          "name": "tree",
          "writable": true,
          "relations": [
            "report"
          ]
        },
        {
          "name": "report",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              },
              {
                "kind": "account",
                "path": "report.dayStartTs",
                "account": "report"
              }
            ]
          }
        },
        {
          "name": "paymentTokenAccount",
          "writable": true
        },
        {
          "name": "revenueTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  101,
                  110,
                  117,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "purchaseTree",
      "discriminator": [
        17,
        227,
        20,
        146,
        156,
        5,
        193,
        123
      ],
      "accounts": [
        {
          "name": "creator",
          "signer": true,
          "relations": [
            "tree"
          ]
        },
        {
          "name": "tree",
          "writable": true
        },
        {
          "name": "fundingTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              }
            ]
          }
        },
        {
          "name": "supplierPaymentTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "setAdmins",
      "discriminator": [
        152,
        38,
        44,
        217,
        51,
        199,
        77,
        92
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "program",
          "address": "EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n"
        },
        {
          "name": "programData"
        },
        {
          "name": "adminConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  115
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "admins",
          "type": {
            "vec": "pubkey"
          }
        }
      ]
    },
    {
      "name": "submitReport",
      "discriminator": [
        27,
        178,
        64,
        9,
        20,
        46,
        250,
        14
      ],
      "accounts": [
        {
          "name": "reporter",
          "writable": true,
          "signer": true,
          "relations": [
            "tree"
          ]
        },
        {
          "name": "tree",
          "writable": true
        },
        {
          "name": "report",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              },
              {
                "kind": "arg",
                "path": "dayStartTs"
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
          "name": "dayStartTs",
          "type": "i64"
        },
        {
          "name": "wh",
          "type": {
            "vec": "u32"
          }
        }
      ]
    },
    {
      "name": "transferShares",
      "discriminator": [
        23,
        136,
        140,
        15,
        181,
        54,
        120,
        175
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "recipient"
        },
        {
          "name": "tree",
          "relations": [
            "position"
          ]
        },
        {
          "name": "shareMint"
        },
        {
          "name": "shareTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "shareMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "recipientShareTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipient"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "shareMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "recipientPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tree"
              },
              {
                "kind": "account",
                "path": "recipient"
              }
            ]
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "adminConfig",
      "discriminator": [
        156,
        10,
        79,
        161,
        71,
        9,
        62,
        77
      ]
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ]
    },
    {
      "name": "report",
      "discriminator": [
        232,
        246,
        229,
        227,
        242,
        105,
        190,
        2
      ]
    },
    {
      "name": "tree",
      "discriminator": [
        100,
        9,
        213,
        154,
        6,
        136,
        109,
        55
      ]
    }
  ],
  "events": [
    {
      "name": "invoiceIssued",
      "discriminator": [
        63,
        225,
        173,
        230,
        246,
        121,
        53,
        65
      ]
    },
    {
      "name": "invoicePaid",
      "discriminator": [
        200,
        211,
        168,
        170,
        46,
        82,
        83,
        186
      ]
    },
    {
      "name": "productionReported",
      "discriminator": [
        171,
        85,
        247,
        35,
        59,
        48,
        138,
        217
      ]
    },
    {
      "name": "rewardsClaimed",
      "discriminator": [
        75,
        98,
        88,
        18,
        219,
        112,
        88,
        121
      ]
    },
    {
      "name": "sharesTransferred",
      "discriminator": [
        219,
        222,
        239,
        232,
        2,
        70,
        64,
        200
      ]
    },
    {
      "name": "treeChanged",
      "discriminator": [
        56,
        129,
        98,
        102,
        118,
        245,
        244,
        124
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidInput",
      "msg": "Invalid configuration or amount"
    },
    {
      "code": 6001,
      "name": "invalidPhase",
      "msg": "Instruction unavailable in this tree phase"
    },
    {
      "code": 6002,
      "name": "fundingCap",
      "msg": "Funding target would be exceeded"
    },
    {
      "code": 6003,
      "name": "overflow",
      "msg": "Arithmetic limit exceeded"
    },
    {
      "code": 6004,
      "name": "invalidDay",
      "msg": "Report must cover the next complete UTC day"
    },
    {
      "code": 6005,
      "name": "balanceMismatch",
      "msg": "Share balance differs from the reward ledger"
    },
    {
      "code": 6006,
      "name": "noRewards",
      "msg": "No paid rewards are available to claim"
    },
    {
      "code": 6007,
      "name": "overpayment",
      "msg": "Payment exceeds the invoice balance"
    },
    {
      "code": 6008,
      "name": "invoiceAlreadyIssued",
      "msg": "An invoice has already been issued for this report"
    },
    {
      "code": 6009,
      "name": "invoiceNotIssued",
      "msg": "The backend has not issued an invoice for this report"
    },
    {
      "code": 6010,
      "name": "invalidPaymentMint",
      "msg": "Only the initialized demo payment mint is supported"
    },
    {
      "code": 6011,
      "name": "unauthorized",
      "msg": "Signer is not authorized for this operation"
    },
    {
      "code": 6012,
      "name": "invalidAdmins",
      "msg": "Admin list must contain 1 to 10 distinct nonzero wallets"
    }
  ],
  "types": [
    {
      "name": "adminConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admins",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future fields; preserve on updates."
            ],
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          }
        ]
      }
    },
    {
      "name": "invoiceIssued",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tree",
            "type": "pubkey"
          },
          {
            "name": "report",
            "type": "pubkey"
          },
          {
            "name": "dayStartTs",
            "type": "i64"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "invoicePaid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tree",
            "type": "pubkey"
          },
          {
            "name": "report",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "phase",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "funding"
          },
          {
            "name": "funded"
          },
          {
            "name": "purchased"
          },
          {
            "name": "active"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tree",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "shares",
            "type": "u64"
          },
          {
            "name": "index",
            "type": "u128"
          },
          {
            "name": "pendingScaled",
            "type": "u128"
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future fields; preserve on updates."
            ],
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          }
        ]
      }
    },
    {
      "name": "productionReported",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tree",
            "type": "pubkey"
          },
          {
            "name": "report",
            "type": "pubkey"
          },
          {
            "name": "dayStartTs",
            "type": "i64"
          },
          {
            "name": "totalWh",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "report",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tree",
            "type": "pubkey"
          },
          {
            "name": "dayStartTs",
            "docs": [
              "Unix timestamp in seconds for the start of this UTC day."
            ],
            "type": "i64"
          },
          {
            "name": "submittedAt",
            "type": "i64"
          },
          {
            "name": "reporter",
            "type": "pubkey"
          },
          {
            "name": "wh",
            "docs": [
              "Readings supplied by the reporter, without count or energy-value validation."
            ],
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "totalWh",
            "type": "u64"
          },
          {
            "name": "invoiceIssued",
            "docs": [
              "Backend invoice is immutable once issued, including a zero-amount bill."
            ],
            "type": "bool"
          },
          {
            "name": "due",
            "docs": [
              "Final invoice amount in payment-mint base units; calculated off-chain."
            ],
            "type": "u64"
          },
          {
            "name": "paid",
            "type": "u64"
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future fields; preserve on updates."
            ],
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          }
        ]
      }
    },
    {
      "name": "rewardsClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tree",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "sharesTransferred",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tree",
            "type": "pubkey"
          },
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "to",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "tree",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "seedId",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "client",
            "type": "pubkey"
          },
          {
            "name": "reporter",
            "type": "pubkey"
          },
          {
            "name": "paymentMint",
            "type": "pubkey"
          },
          {
            "name": "shareMint",
            "type": "pubkey"
          },
          {
            "name": "target",
            "type": "u64"
          },
          {
            "name": "raised",
            "type": "u64"
          },
          {
            "name": "phase",
            "type": {
              "defined": {
                "name": "phase"
              }
            }
          },
          {
            "name": "nextDayStartTs",
            "type": "i64"
          },
          {
            "name": "totalWh",
            "type": "u64"
          },
          {
            "name": "billed",
            "type": "u64"
          },
          {
            "name": "paid",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "u64"
          },
          {
            "name": "rewardIndex",
            "type": "u128"
          },
          {
            "name": "rewardRemainder",
            "type": "u128"
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future fields; preserve on updates."
            ],
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          }
        ]
      }
    },
    {
      "name": "treeChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tree",
            "type": "pubkey"
          },
          {
            "name": "phase",
            "type": {
              "defined": {
                "name": "phase"
              }
            }
          },
          {
            "name": "raised",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
