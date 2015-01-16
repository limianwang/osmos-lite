
TESTS = $(shell find tests -name 'test_*.js')

.PHONY: clean
clean:
	rm -f npm-debug.log
	rm -rf node_modules

.PHONY: install
install:
	npm install

.PHONY: test
test:
	./node_modules/mocha/bin/mocha --use-strict -t 20000 -R spec -u bdd --harmony $(TESTS)

test-cov:
	node --harmony ./node_modules/istanbul/lib/cli.js cover ./node_modules/mocha/bin/_mocha $(TESTS)

