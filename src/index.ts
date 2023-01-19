import generate from "@babel/generator";
var _ = require('lodash');

// Common names
const lodashVarName: string = "_";
const fnRequireName: string = "require";
const fsVarName: string = "fs";
const outputFileFolderName: string = "output";
const runtimeDataVarName: string = "runtimeData$";
const callStackVarName: string = "callStack$";
const controlStackVarName: string = "controlStack$";
const conditionMapVarName: string = "conditionMap$";
const fnStartName: string = "fnStart$";
const fnEndName: string = "fnEnd$";
const fnGetLineNumberName: string = "getLineNumber$";
const fnLogRuntimeDataName: string = "logRuntimeData$";
const fnObjName: string = "fnObjName$"
const functionNameProperty: string = "function_name$";
const callerLineNumberParamName: string = "lineNumber$";
const localControlStackVarName: string = "localControlStack$";

// States
const instrumentFunctions: string[] = [fnStartName, fnEndName, fnLogRuntimeDataName, fnGetLineNumberName, fnRequireName];
const userDefinedFunctions: string[] = [];
let controlCount: bigint = BigInt(0);
var functionNames: string[] = [];
var trackedIfStatements: string[] = [];

function getControlCount() {
  return controlCount++;
}

function operationLogging(babel: any) {
  const { types: t } = babel;

  // Handle the control stack in the event of early return statements
  function handleReturnWithinConditionalStatement(path: any) {
    const controlStackPop = createControlStackVarPopStatement();

    path.traverse({
      ReturnStatement(path: any) {
        path.insertBefore(controlStackPop);
        path.insertBefore(controlStackPop);
      }
    });

  }

  function createLocalControlStackStatement() {
    const statement = t.variableDeclaration(
      'let',
      [
        t.variableDeclarator(
          t.identifier(localControlStackVarName),
          t.arrayExpression([])
        )
      ]
    );

    return statement;
  }

  function createControlStackVarPopStatement() {
    const statement = t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          t.identifier(localControlStackVarName),
          t.identifier("pop")
        ),
        []
      )
    );

    return statement;
  }

  function createControlVarStackPushStatement(arg: any) {
    const statement = t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          t.identifier(localControlStackVarName),
          t.identifier("push")
        ),
        [arg]
      )
    );

    return statement;
  }

  // controlContext["if34"] = "if(hi == bye)"
  function createControlMapStatement(id: string, content: string) {
    return t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.memberExpression(
          t.identifier(conditionMapVarName),
          t.identifier(id)
        ),
        t.stringLiteral(content)
      )
    );
  }

  function createFnStartStatement(fnName: string, fnObjectName: string) {
    return t.variableDeclaration(
      "const",
      [t.variableDeclarator(
        t.identifier(fnObjectName),
        t.callExpression(
          t.identifier(fnStartName),
          [
            t.stringLiteral(fnName),
            t.identifier(callerLineNumberParamName)
          ]
        )
      )]
    )
  }

  function createFnEndStatement(fnObjectName: string) {
    return t.callExpression(
      t.identifier(fnEndName),
      [t.identifier(fnObjectName)]
    )
  }

  // Return a console.log expression with the given arguments
  const createConsoleCall = (...consoleParams: any) => {
    const consoleStatement = t.callExpression(
      t.memberExpression(
        t.identifier('console'),
        t.identifier('log'),
        false
      ),
      [...consoleParams]
    );

    return consoleStatement;
  }

  return {
    name: 'operation-logging',
    visitor: {

      // Edit the program body with boilerplate code
      Program(path: any) {
        // At the start, record all the user-defined functions
        path.traverse({
          FunctionDeclaration(path: any) {
            const functionName = path.node.id.name;
            userDefinedFunctions.push(functionName);
          }
        });

        // Library import statements
        const importLodash = t.variableDeclaration('var',
          [
            t.variableDeclarator(
              t.identifier(lodashVarName),
              t.callExpression(
                t.identifier(fnRequireName),
                [t.stringLiteral('lodash')]
              ),
            )
          ]
        );


        const importFs = t.variableDeclaration('var',
          [
            t.variableDeclarator(
              t.identifier(fsVarName),
              t.callExpression(
                t.identifier(fnRequireName),
                [t.stringLiteral('fs')]
              )
            )
          ]
        )

        // Global variables
        const runtimeDataVar = t.variableDeclaration('var',
          [
            t.variableDeclarator(
              t.identifier(runtimeDataVarName),
              t.arrayExpression()
            )
          ]);

        const callStackVar = t.variableDeclaration('var',
          [
            t.variableDeclarator(
              t.identifier(callStackVarName),
              t.arrayExpression()
            )
          ]);

        const controlStackVar = t.variableDeclaration('var',
          [
            t.variableDeclarator(
              t.identifier(controlStackVarName),
              t.arrayExpression()
            )
          ]);

        const conditionMapVar = t.variableDeclaration('var',
          [
            t.variableDeclarator(
              t.identifier(conditionMapVarName),
              t.objectExpression([])
            )
          ]);

        const localControlStackVar = createLocalControlStackStatement();

        // Program analysis functions
        const calleeNameParamName: string = "calleeName$";
        const timeStart: string = "time_start$";
        const timeEndName: string = "time_end$";
        const parentName: string = "parent_name$";
        const fnName: string = "fnName$";
        const control: string = "control$";
        const length: string = "length";
        const push: string = "push";
        const recursiveDepthName: string = "recursiveDepth$";
        const nameVarName: string = "name$";
        const depthVarName: string = "depth$";
        const parentNameVarName: string = "parentName$";
        const startIndexVarName: string = "startIndex$";

        const fnStart = t.functionDeclaration(
          t.identifier(fnStartName),
          [
            t.identifier(calleeNameParamName),
            t.identifier(callerLineNumberParamName)
          ],
          t.blockStatement(
            [
              t.variableDeclaration(
                "let",
                [
                  t.variableDeclarator(
                    t.identifier(recursiveDepthName),
                    t.numericLiteral(1)
                  )
                ]
              ),
              t.forOfStatement(
                t.variableDeclaration(
                  "const",
                  [
                    t.variableDeclarator(
                      t.identifier(nameVarName)
                    )
                  ]
                ),
                t.identifier(callStackVarName),
                t.blockStatement(
                  [
                    t.variableDeclaration(
                      "let",
                      [
                        t.variableDeclarator(
                          t.identifier(startIndexVarName),
                          null
                        )
                      ]
                    ),
                    t.ifStatement(
                      t.callExpression(
                        t.identifier("isNaN"),
                        [
                          t.memberExpression(
                            t.identifier(nameVarName),
                            t.numericLiteral(0),
                            true,
                            false  
                          ),
                        ]
                      ),
                      t.blockStatement([
                        t.expressionStatement(
                          t.assignmentExpression(
                            "=",
                            t.identifier(startIndexVarName),
                            t.numericLiteral(0)
                          )
                        )
                      ]),
                      t.blockStatement(
                        [
                          t.expressionStatement(
                            t.assignmentExpression(
                              "=",
                              t.identifier(startIndexVarName),
                              t.binaryExpression(
                                "+",
                                t.callExpression(
                                  t.memberExpression(
                                    t.identifier(nameVarName),
                                    t.identifier("indexOf")
                                  ),
                                  [
                                    t.stringLiteral("_")
                                  ]
                                ),
                                t.numericLiteral(1)
                              )          
                            )
                          )
                        ]
                      )
                    ),
                    t.variableDeclaration(
                      'let',
                      [
                        t.variableDeclarator(
                          t.identifier(parentNameVarName),
                          t.callExpression(
                            t.memberExpression(
                              t.identifier(nameVarName),
                              t.identifier("substring")
                            ),
                            [
                              t.identifier(startIndexVarName),
                              t.callExpression(
                                t.memberExpression(
                                  t.identifier(nameVarName),
                                  t.identifier("lastIndexOf")
                                ),
                                [
                                  t.stringLiteral("_")
                                ]
                              )
                            ]
                          )
                        )
                      ]
                    ),
                    t.ifStatement(
                      t.callExpression(
                        t.memberExpression(
                          t.identifier(lodashVarName),
                          t.identifier("isEqual")
                        ),
                        [
                          t.identifier(parentNameVarName),
                          t.identifier(calleeNameParamName)
                        ]
                      ),
                      t.blockStatement(
                        [
                          t.expressionStatement(
                            t.updateExpression(
                              '++',
                              t.identifier(recursiveDepthName)
                            )
                          )
                        ]
                      )
                    )
                  ]
                )
              ),
              t.variableDeclaration(
                "let",
                [
                  t.variableDeclarator(
                    t.identifier(depthVarName),
                    t.conditionalExpression(
                      t.binaryExpression(
                        "===",
                        t.identifier(recursiveDepthName),
                        t.numericLiteral(1)
                      ),
                      t.stringLiteral(""),
                      t.binaryExpression(
                        "+",
                        t.identifier(recursiveDepthName),
                        t.stringLiteral("_")
                      )
                    )
                  )
                ]
              ),
              t.variableDeclaration(
                "let",
                [t.variableDeclarator(
                  t.identifier(fnName),
                  t.binaryExpression(
                    "+",
                    t.binaryExpression(
                      "+",
                      t.binaryExpression(
                       "+",
                        t.identifier(depthVarName),
                        t.identifier(calleeNameParamName),
                      ),
                      t.stringLiteral("_")
                    ),
                    t.identifier(callerLineNumberParamName)
                  )
                )]
              ),
              t.variableDeclaration(
                "const",
                [
                  t.variableDeclarator(
                    t.identifier(fnObjName),
                    t.objectExpression([
                      t.objectProperty(
                        t.stringLiteral(timeStart),
                        t.callExpression(
                          t.memberExpression(
                            t.identifier("Date"),
                            t.identifier("now")),
                          [])),
                      t.objectProperty(
                        t.stringLiteral(timeEndName),
                        t.numericLiteral(0)),
                      t.objectProperty(
                        t.stringLiteral(functionNameProperty),
                        t.identifier(fnName)),
                      t.objectProperty(
                        t.stringLiteral(parentName),
                        t.conditionalExpression(
                          // test
                          t.memberExpression(
                            t.identifier(callStackVarName),
                            t.identifier(length)
                          ),
                          // consequent
                          t.memberExpression(
                            t.identifier(callStackVarName),
                            t.binaryExpression(
                              "-",
                              t.memberExpression(
                                t.identifier(callStackVarName),
                                t.identifier(length)
                              ),
                              t.numericLiteral(1)
                            ),
                            true
                          ),
                          // alternate
                          t.stringLiteral("")
                        )),
                      t.objectProperty(
                        t.stringLiteral(control),
                        t.arrayExpression([
                          t.spreadElement(t.identifier(controlStackVarName))
                        ])
                      )
                    ]))]),
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier(runtimeDataVarName),
                    t.identifier(push)
                  ),
                  [t.identifier(fnObjName)]
                )
              ),
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier(callStackVarName),
                    t.identifier(push)
                  ),
                  [t.identifier(fnName)]
                )
              ),
              t.returnStatement(t.identifier(fnObjName)),
            ]
          )
        );

        const fnEnd = t.functionDeclaration(
          t.identifier(fnEndName),
          [t.identifier(fnObjName)],
          t.blockStatement(
            [
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier(callStackVarName),
                    t.identifier("pop")
                  ),
                  []
                )
              ),
              t.expressionStatement(
                t.assignmentExpression(
                  "=",
                  t.memberExpression(
                    t.identifier(fnObjName),
                    t.identifier(timeEndName),
                  ),
                  t.callExpression(
                    t.memberExpression(
                      t.identifier("Date"),
                      t.identifier("now")),
                    [])
                )
              )
            ]
          )
        )

        const fnLogRuntimeData = t.functionDeclaration(
          t.identifier(fnLogRuntimeDataName),
          [],
          t.blockStatement(
            [
              t.ifStatement(
                t.unaryExpression(
                  '!',
                  t.callExpression(
                    t.memberExpression(
                      t.identifier(fsVarName),
                      t.identifier('existsSync')
                    ),
                    [
                      t.stringLiteral(outputFileFolderName)
                    ]
                  ),
                  true
                ),
                t.blockStatement(
                  [
                    t.expressionStatement(
                      t.callExpression(
                        t.memberExpression(
                          t.identifier(fsVarName),
                          t.identifier('mkdir')
                        ),
                        [
                          t.stringLiteral(outputFileFolderName),
                          t.functionExpression(
                            null,
                            [
                              t.identifier('err')
                            ],
                            t.blockStatement(
                              [
                                t.ifStatement(
                                  t.identifier('err'),
                                  t.blockStatement(
                                    [
                                      t.returnStatement(
                                        createConsoleCall(t.identifier('err'))
                                      )
                                    ]
                                  )
                                )
                              ]
                            )
                          )
                        ]
                      )
                    ),
                  ],
                ),
                null
              ),
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier(fsVarName),
                    t.identifier('writeFile')
                  ),
                  [
                    t.stringLiteral('./data/output.json'),
                    t.callExpression(
                      t.memberExpression(
                        t.identifier('JSON'),
                        t.identifier('stringify')
                      ),
                      [
                        t.objectExpression(
                          [t.objectProperty(t.identifier("data"), t.identifier(runtimeDataVarName)),
                          t.objectProperty(t.identifier("conditionalMap"), t.identifier(conditionMapVarName))]
                        )
                      ]
                    ),
                    t.functionExpression(
                      null,
                      [
                        t.identifier('err')
                      ],
                      t.blockStatement(
                        [
                          t.ifStatement(
                            t.identifier('err'),
                            t.blockStatement(
                              [
                                t.returnStatement(
                                  createConsoleCall(t.identifier('err'))
                                )
                              ]
                            )
                          ),
                          t.expressionStatement(
                            createConsoleCall(t.stringLiteral('Output data logged'))
                          )
                        ]
                      )
                    )
                  ]
                )
              )
            ]
          )
        );

        const callFnGetLineNumber = t.functionDeclaration(
          t.identifier(fnGetLineNumberName),
          [],
          t.blockStatement(
            [
              t.variableDeclaration(
                "let",
                [
                  t.variableDeclarator(
                    t.identifier("e"),
                    t.newExpression(
                      t.identifier("Error"),
                      []
                    )
                  )
                ]
              ),
              t.variableDeclaration(
                "let",
                [
                  t.variableDeclarator(
                    t.identifier("frame"),
                    t.memberExpression(
                      t.callExpression(
                        t.memberExpression(
                          t.memberExpression(
                            t.identifier("e"),
                            t.identifier("stack"),
                          ),
                          t.identifier(
                            "split"
                          )
                        ),
                        [
                          t.stringLiteral("\n")
                        ]
                      ),
                      t.numericLiteral(2),
                      true
                    )
                  )
                ]
              ),
              t.variableDeclaration(
                "let",
                [
                  t.variableDeclarator(
                    t.identifier("lineNumber"),
                    t.memberExpression(
                      t.callExpression(
                        t.memberExpression(
                          t.callExpression(
                            t.memberExpression(
                              t.identifier("frame"),
                              t.identifier("split")
                            ),
                            [t.stringLiteral(":")]
                          ),
                          t.identifier("reverse")
                        ),
                        []
                      ),
                      t.numericLiteral(1),
                      true
                    )
                  )
                ]
              ),
              t.returnStatement(
                t.identifier("lineNumber")
              )
            ]
          )
        );

        const callFnLogRuntimeData = t.callExpression(
          t.identifier(fnLogRuntimeDataName),
          []
        );

        path.unshiftContainer('body',
          [importFs, importLodash, runtimeDataVar, callStackVar, controlStackVar, conditionMapVar, fnStart, fnEnd, fnLogRuntimeData, callFnGetLineNumber, localControlStackVar]);

        path.pushContainer('body', [callFnLogRuntimeData]);
      },
      WhileStatement(path: any) {
        const id = "while" + getControlCount();
        const testStatement = `while (${generate(path.node.test).code})`;
        const ctrlMapStatement = createControlMapStatement(id, testStatement);
        //push fn start in front
        const whileLoopTrackStatement = createControlVarStackPushStatement(
          // need to compile node back to string
          t.arrayExpression([t.stringLiteral(id)])
        );

        const whileLoopPop = createControlStackVarPopStatement();

        path.get('body').unshiftContainer('body', [ctrlMapStatement, whileLoopTrackStatement]);
        path.get('body').pushContainer('body', [whileLoopPop]);

        handleReturnWithinConditionalStatement(path);
      },
      ForStatement(path: any) {
        const id = "for" + getControlCount();
        // compile node back to string
        const testStatement = `for (${generate(path.node.init).code} ${generate(path.node.test).code}; ${generate(path.node.update).code})`;
        const ctrlMapStatement = createControlMapStatement(id, testStatement);

        const forLoopTrackStatement = createControlVarStackPushStatement(t.arrayExpression([t.stringLiteral(id)]));
        const forLoopPop = createControlStackVarPopStatement();

        path.get('body').unshiftContainer('body', [ctrlMapStatement, forLoopTrackStatement]);
        path.get('body').pushContainer('body', [forLoopPop]);

        handleReturnWithinConditionalStatement(path);
      },
      // Edit user-defined functions
      FunctionDeclaration(path: any) {
        const functionName = path.node.id.name;

        // ignore our functions
        if (_.includes(instrumentFunctions, functionName)) {
          path.skip();
          return;
        }
        
        // Add parameter for passing in the line number
        path.node.params.unshift(t.identifier(callerLineNumberParamName));

        functionNames.push(functionName);
        const fnObjCreationStatement = createFnStartStatement(functionName, fnObjName)
        const fnObjEndStatement = createFnEndStatement(fnObjName)
        const localControlStackStatement = createLocalControlStackStatement();

        path.get('body').unshiftContainer('body',
          [fnObjCreationStatement, localControlStackStatement]);
        path.get('body').pushContainer('body', fnObjEndStatement);
      },
      ReturnStatement(path: any) {
        // If there is a Return statement, pop the function calls. At this point, the function always ends

        const fnObjEndStatement = createFnEndStatement(fnObjName);

        path.insertBefore(fnObjEndStatement);
      },
      IfStatement(path: any) {
        const testStatement = `if (${generate(path.node.test).code})`;
        const id = "if" + getControlCount();
        const ctrlMapStatement = createControlMapStatement(id, testStatement);

        const ifTrackStatement = t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.identifier(localControlStackVarName),
              t.identifier("push")
            ),
            [t.arrayExpression([t.stringLiteral(id), t.stringLiteral(`true`)])]
          )
        );

        const ifPop = t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.identifier(localControlStackVarName),
              t.identifier("pop")
            ),
            []
          )
        );

        path.get('consequent').unshiftContainer('body', [ctrlMapStatement, ifTrackStatement]);
        path.get('consequent').pushContainer('body', [ifPop]);

        handleReturnWithinConditionalStatement(path);

        trackedIfStatements.push(id);

        // If alternate is a BlockStatement, then the next statement is an else.
        // Handle else statements here
        let hasElse: boolean = path.node.alternate?.type === "BlockStatement";
        if (hasElse) {
          const ifStatements: string = trackedIfStatements.toString();

          const elseTrackStatement = t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(localControlStackVarName),
                t.identifier("push")
              ),
              [t.arrayExpression([t.stringLiteral(ifStatements), t.stringLiteral(`false`)])]
            )
          );

          const elsePop = t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier(localControlStackVarName),
                t.identifier("pop")
              ),
              []
            )
          );

          path.get('alternate').unshiftContainer('body', [ctrlMapStatement, elseTrackStatement]);
          path.get('alternate').pushContainer('body', [elsePop]);
        }

        // If alternate doesn't exist or it's an else, empty the stack
        if (_.isNil(path.node.alternate) || hasElse) {
          trackedIfStatements = [];
        }
      },
      // Whenever there is a call to one of the user-defined functions, inject the line number
      // and set the controlStack$
      CallExpression(path: any) {
        const functionName = path.node.callee.name;

        if (_.isNil(functionName) || !_.includes(userDefinedFunctions, functionName)) {
          path.skip();
          return;
        }

        path.node.arguments.unshift(t.callExpression(t.identifier(fnGetLineNumberName),[]));

        const setControlStack = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.identifier(controlStackVarName),
            t.identifier(localControlStackVarName)
          )
        );
        path.insertBefore(setControlStack);

        path.skip();
      }
    },
  };
}

export default operationLogging;
