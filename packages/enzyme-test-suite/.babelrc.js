module.exports = {
  "presets": [
    ["airbnb", { "transformRuntime": false }],
  ],
  "plugins": [
    ["transform-replace-object-assign", { "moduleSpecifier": "object.assign" }],
    ["add-module-exports"],
    [
      "babel-plugin-module-resolver",
      {
        alias: process.env.PREACT
          ? {
              react: "preact/compat",
            }
          : {},
      },
    ],
  ],
  "sourceMaps": "both",
}
