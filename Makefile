
TESTS = $(shell find tests -name 'test_*.js')
FLAGS = --harmony --harmony-proxies
TIMEOUT = 20000

test:
	node $(FLAGS) ./node_modules/.bin/_mocha --use-strict -t $(TIMEOUT) -R spec -u bdd $(TESTS)

test-cov:
	node $(FLAGS) ./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- -t $(TIMEOUT) $(TESTS)

.PHONY: test test-cov
