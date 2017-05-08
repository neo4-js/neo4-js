# Neo4-js

Neo4-js is a object-graph mapper for JavaScript and neo4j with full flow-type support. Neo4-js hides repetitive queries such as the basic CRUD operations to the developer. For best development experience use flow-type from Facebook to obtain good autocomplete results.

In this document you'll find the basic usage of the library.

# Getting started

In this getting started guide, we are going to build a model for a small todo application.

While using this getting started guide, I recommend using the [Visual Studio Code](https://code.visualstudio.com) editor with the [flow-for-vscode](https://github.com/flowtype/flow-for-vscode) extension, because I got the best results for autocomplete with it, but feel free to use any Editor of your preference. Make sure you can call the [flow](https://flow.org/en/docs/install/) command from your console line. Otherwise you need to set `"flow.useNPMPackagedFlow": true` in your VS Code settings and install flow within the project via `yarn add -D flow-bin`.

    mkdir todo
    cd todo
    yarn init -y
    yarn add neo4-js

Then paste this command to install the dev-dependencies

    yarn add -D babel-plugin-transform-class-properties babel-plugin-transform-decorators babel-plugin-transform-decorators-legacy babel-preset-es2015 babel-preset-flow babel-preset-stage-3

Run `flow init` to generate the `.flowconfig` file and paste the following into it to get the autocomplete results from flow.

    [include]
    src

    [ignore]
    .*/node_modules/fbjs/.*
    .*/node_modules/config-chain/test/broken.json
    .*/node_modules/npmconf/test/.*

    [options]
    esproposal.decorators=ignore

