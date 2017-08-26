# Neo4-js

[![Build Status](https://travis-ci.org/JanPeter/neo4js.svg?branch=master)](https://travis-ci.org/JanPeter/neo4js) [![dependencies Status](https://david-dm.org/janpeter/neo4js/status.svg)](https://david-dm.org/janpeter/neo4js) [![devDependencies Status](https://david-dm.org/janpeter/neo4js/dev-status.svg)](https://david-dm.org/janpeter/neo4js?type=dev) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Neo4-js is a object-graph mapper for JavaScript and neo4j with full flow-type support. Neo4-js hides repetitive queries such as the basic CRUD operations to the developer. For best development experience use flow-type from Facebook to obtain good autocomplete results.

## Documentation

The documentation is not completed yet but you'll find the basics on [neo4.js.org](https://neo4.js.org). Any help is very much appreciated!

## Installing

To use neo4-js properly you need to add babel, some presets and a few plugins. You might also add flow for static type checking and autocomplete support.

```
yarn add -D babel-cli babel-core babel-plugin-transform-class-properties babel-plugin-transform-decorators-legacy babel-preset-es2015 babel-preset-stage-3
```

To add flow install the following

```
yarn add -D babel-preset-flow flow-bin
```

The `.babelrc` needs to include the following, depending on your usage of flow add or remove the flow preset acordingly.

```
{
  "presets": ["stage-3", "es2015", "flow"],
  "plugins": [
    "transform-decorators-legacy",
    "transform-class-properties"
  ]
}
```

You might also install Docker to quickly create a neo4j database without any further installations. For neo4-js I used the following bash script to start a neo4j instance in docker. To run it you might create a scripts directory and add the following to `neo4j-startup.sh`, make sure you can execute the script with `chmod 777 neo4j-startup.sh` (because why not 777 on my local machine :P).

```
# REST PORT: 10000
# BOLT PORT: 10001
echo "docker run -p 10000:7474 -p 10001:7687 --rm --env=NEO4J_AUTH=none neo4j"
docker run -p 10000:7474 -p 10001:7687 --rm --env=NEO4J_AUTH=none neo4j
```

The only runtime dependency you need to start using neo4-js is neo4-js itself.

```
yarn add neo4-js
```

### Installing it for vanilla node.js without Babel

Although I recommend you are using Babel for your project, it is possible to use it without. Take [this guide](https://neo4.js.org/docs/vanilla-node-guide.html) to get started with neo4-js without the usage of Babel.

## Built With

* [Babel](https://babeljs.io) - JavaScript compiler to use next gen EcmaScript features
* [Flow](https://flow.org) - Static type checker from Facebook

## Contributing

Feel free to send a pull request or create an issue for bugs or feature requests.

## Authors

* **Jan Schlacher** - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
