
TESTS = $(shell find tests -name 'test_*.js')
FLAGS = --harmony --harmony-proxies
TIMEOUT = 20000

.PHONY: test
test:
	./node_modules/.bin/mocha --use-strict -t $(TIMEOUT) -R spec -u bdd $(FLAGS) $(TESTS)

.PHONY: test-cov
test-cov:
	node $(FLAGS) ./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- -t $(TIMEOUT) $(TESTS)

