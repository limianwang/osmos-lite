/*jshint expr:true*/

'use strict';

var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Model = Osmos.Model;

var MySQL = Osmos.drivers.MySQL;

var expect = require('chai').expect;
var async = require('async');
var fs = require('fs');
var path = require('path');

var driver;
var model;

describe('The MySQL driver', function() {
   
  before(function(done) {
    var pool = MySQL.createPool('localhost', 'osmos', 'root', 'osmos');

    async.waterfall(
      [
        function(cb) {
          pool.getConnection(cb);
        },
        function (db, cb) {
          expect(db).to.be.an('object');

          var commands = [];

          fs.readFileSync(path.join(__dirname, '../fixtures/mysql_fixtures.sql')).toString().split('###').forEach(function(command) {
            command = command.trim();

            if (command.length) commands.push(command);
          });

          async.each(
            commands, 
            function(command, cb) {
              db.query(command, cb);
            },
            cb
          );
        }
      ],

      function (err) {
        expect(err).not.to.be.ok;

        driver = new MySQL(pool);

        done();
      }
    );
  });

  it('should properly render a schema from an existing table', function(done) {
    driver.generateSchema('datatypes', function(err, schema) {
      expect(err).not.to.be.ok;
      
      fs.readFile(path.join(__dirname, '../fixtures/mysql_schema.json'), function(err, json) {
        expect(schema).to.deep.equal(JSON.parse(json));

        done();
      });
    });
  });
    
  it.skip('should allow creating new documents', function(done) {
  });
    
  it.skip('should allow posting documents and reading their key', function(done) {
  });
    
  it.skip('should allow putting documents and reading their key', function(done) {
  });
    
  it.skip('should allow updating individual fields independently', function(done) {
  });
    
  it.skip('should allow putting and retrieving documents by their key', function(done) {
  });
    
  it.skip('should allow deleting documents by their key', function(done) {
  });
    
  it.skip('should allow querying for individual documents', function(done) {
  });
    
  it.skip('should allow querying for multiple documents based on secondary indices', function(done) {
  });
    
  it.skip('should return multiple documents when using find()', function(done) {
  });
    
  it.skip('should return document metadata when using findLimit()', function(done) {
  });        
    
  it.skip('should properly skip documents when using findLimit()', function(done) {
  });

});