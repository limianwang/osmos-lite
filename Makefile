
TESTS = $(shell find tests -name 'test_*.js')
FLAGS = --harmony --harmony-proxies

.PHONY: clean
clean:
	rm -f npm-debug.log
	rm -rf node_modules
	rm -rf coverage

.PHONY: install
install:
	npm install

.PHONY: test
test:
	./node_modules/.bin/mocha --use-strict -t 20000 -R spec -u bdd $(FLAGS) $(TESTS)

.PHONY: test-cov
test-cov:
	node --harmony-proxies ./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- -t 20000 $(TESTS)

