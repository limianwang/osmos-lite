/*

Originally from http://nv.github.com/objectDiff.js/

Modified by Marco Tabini to support date comparison.

 */

'use strict';

var objectDiff = typeof exports != 'undefined' ? exports : {};

/**
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 */
objectDiff.diff = function diff(a, b) {

  if (a === b) {
    return {
      changed: 'equal',
      value: a
    }
  }

  var value = {};
  var equal = true;

  for (var key in a) {
    if (key in b) {
      if (a[key] === b[key]) {
        value[key] = {
          changed: 'equal',
          value: a[key]
        }
      } else {
        var typeA = typeof a[key];
        var typeB = typeof b[key];

        if (a[key] && a[key].constructor.name == 'Date') typeA = 'date';
        if (b[key] && b[key].constructor.name == 'Date') typeB = 'date';

        if (a[key] && b[key] && (typeA == 'object' || typeA == 'function') && (typeB == 'object' || typeB == 'function')) {
          var valueDiff = diff(a[key], b[key]);
          if (valueDiff.changed == 'equal') {
            value[key] = {
              changed: 'equal',
              value: a[key]
            }
          } else {
            equal = false;
            value[key] = valueDiff;
          }
        } else {
          equal = false;
          value[key] = {
            changed: 'primitive change',
            removed: a[key],
            added: b[key]
          }
        }
      }
    } else {
      equal = false;
      value[key] = {
        changed: 'removed',
        value: a[key]
      }
    }
  }

  for (key in b) {
    if (!(key in a)) {
      equal = false;
      value[key] = {
        changed: 'added',
        value: b[key]
      }
    }
  }

  if (equal) {
    return {
      changed: 'equal',
      value: a
    }
  } else {
    return {
      changed: 'object change',
      value: value
    }
  }
};
