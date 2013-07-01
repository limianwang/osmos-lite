# Contributing to Osmos

Contributions to Osmos are welcome in the form of bug reports, patches, new drivers and better tests. The only thing I ask is that pull requests be accompanied by covering tests (unless, of course, they don't apply, as would be the case for a documentation patch). Obviously, bug reports that are accompanied by a patch _and_ by a unit tests are given top priority.

If you have written a plugin, please let us know and we'll add it to our plugin page. Make sure to provide the URL for your repository, if public, or documentation pages.

Pointless complaints—especially those about just how bad an idea it is to use Harmony Proxy—will be closed without hesitation.

## A note about tests

Osmos includes an automated unit testing facility that can be invoked with `npm test`. It uses [mocha](http://visionmedia.github.io/mocha/) to execute tests against all the files whose name matches the `tests/test_.*` regular expression, executed from the project's top directory. The testing script automatically digs into subdirectories, so you should feel free to organize your tests neatly. The [chai](http://chaijs.com) library's `expect` BDD syntax is our preferred assertion mechanism.