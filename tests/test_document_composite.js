var expect = require('chai').expect;
var async = require('async');

var Osmos = require('../lib');
var Error = Osmos.Error;
var Schema = Osmos.Schema;
var Model = Osmos.Model;
var validators = Schema.validators;
var configurators = Schema.configurators;
var drivers = Osmos.drivers;

Osmos.registerDriverInstance('db', new drivers.Memory());

var usernameSubschema = new Schema({
    email: [ String, configurators.optional ],
    twitter : [ String , configurators.optional ]
});

var friendSubschema = new Schema({
    name : String,
    usernames : [ Object , usernameSubschema ]
});

var singleFriendSchema = new Schema({
    _primaryKey : [ String , configurators.primaryKey ],
    name : String,
    friend : [ Object , friendSubschema ]
});

var singleFriendModel = new Model(singleFriendSchema, '', 'db');

var multiFriendSchema = new Schema({
    _primaryKey : [ String , configurators.primaryKey ],
    name : String,
    friends : [ Array , Object , friendSubschema ]
});

var multiFriendModel = new Model(multiFriendSchema, '', 'db');

describe('Composite documents', function() {
    it('should work when subdocuments are nested', function(done) {
        singleFriendModel.create(function(err, doc) {
            expect(err).to.be.null;
            
            expect(doc).to.be.an('object');
            expect(doc.constructor.name).to.equal('OsmosDocument');
            
            expect(doc.friend).to.be.an('object');
            expect(doc.friend.constructor.name).to.equal('OsmosSubdocument');
            
            expect(doc.friend.usernames).to.be.an('object');
            expect(doc.friend.usernames.constructor.name).to.equal('OsmosSubdocument');
            
            done();
        });
    });
    
    it('should work when data is written to nested subdocuments', function(done) {
        singleFriendModel.create(function(err, doc) {
            expect(err).to.be.null;

            doc.friend.usernames.email = 'marcot@tabini.ca';
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(0);
            
            expect(doc.friend.usernames.email).to.equal('marcot@tabini.ca');
            
            done();
        });
    });
    
    it('should properly report errors when incorrect data is written to a nested subdocument', function(done) {
        singleFriendModel.create(function(err, doc) {
            expect(err).to.be.null;

            doc.friend.usernames.email = 1
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(1);
            
            var err = doc.errors[0];
            
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.fieldName).to.equal('friend.usernames.email');
            
            done();
        });
    });
    
    it('should properly save documents that contain a nested subdocument', function(done) {
        singleFriendModel.create(function(err, doc) {
            expect(err).to.be.null;

            doc.name = 'Daniel';
            doc.friend.name = 'Marco';
            doc.friend.usernames.email = 'marcot@tabini.ca';
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(0);
            
            doc.save(function(errs) {
                expect(errs).to.be.null;
                
                expect(doc._primaryKey).not.to.be.null;
                
                singleFriendModel.get(doc._primaryKey, function(err, doc) {
                    expect(err).to.be.null;
                    
                    expect(doc).to.be.an('object');
                    expect(doc.constructor.name).to.equal('OsmosDocument');
                    
                    expect(doc.name).to.equal('Daniel');
                    
                    expect(doc.friend).to.be.an('object');
                    expect(doc.friend.constructor.name).to.equal('OsmosSubdocument');
                    
                    expect(doc.friend.name).to.equal('Marco');
                    
                    expect(doc.friend.usernames).to.be.an('object');
                    expect(doc.friend.usernames.constructor.name).to.equal('OsmosSubdocument');
                    
                    expect(doc.friend.usernames.email).to.equal('marcot@tabini.ca');
                
                    done();
                });
            });
        });
    });
    
    it('should work when documents contain arrays of subdocuments', function(done) {
        multiFriendModel.create(function(err, doc) {
            expect(err).to.be.null;
            
            expect(doc).to.be.an('object');
            expect(doc.constructor.name).to.equal('OsmosDocument');
            
            expect(doc.friends).to.be.an('object');
            expect(doc.friends.constructor.name).to.equal('Array');
            
            done();
        });
    });
    
    it('should work when arrays of subdocuments are populated directly', function(done) {
        multiFriendModel.create(function(err, doc) {
            doc.friends.push({ name : 'Marco' , usernames : {} });
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(0);
            
            done();
        });
    });
    
    it('should report errors when arrays of subdocuments are populated with data for non-existing fields', function(done) {
        multiFriendModel.create(function(err, doc) {
            var friend = doc.friends.append();
            
            function test() {
                friend.email = 'marcot@tabini.ca';
            }

            expect(test).to.throw(Error);
            
            done();
        });
    });
    
    it('should report errors when arrays of subdocuments are populated with incorrect data', function(done) {
        multiFriendModel.create(function(err, doc) {
            var friend = doc.friends.append();
            
            friend.usernames.email = 1;
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(1);

            var err = doc.errors[0];
            
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.fieldName).to.equal('friends.usernames.email');
            
            done();
        });
    });
    
    it('should properly save and restore objects that contain arrays of subdocuments', function(done) {
        multiFriendModel.create(function(err, doc) {
            doc.name = 'Daniel';
            
            var friend = doc.friends.append();

            friend.name = 'Marco';
            friend.usernames.email = 'marcot@tabini.ca';
            
            friend = doc.friends.append();

            friend.name = 'Manu';
            friend.usernames.email = 'manu@example.com';
                        
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(0);

            doc.save(function(errs) {
                expect(errs).to.be.null;
                
                multiFriendModel.get(doc._primaryKey, function(err, doc) {
                    expect(err).to.be.null;
                    
                    expect(doc).to.be.an('object');
                    expect(doc.constructor.name).to.equal('OsmosDocument');
                    
                    expect(doc.friends).to.be.an('object');
                    expect(doc.friends).to.have.length(2);
                    
                    var friend = doc.friends[1];
                    
                    expect(friend).to.be.an('object');
                    expect(friend.constructor.name).to.equal('OsmosSubdocument');
                
                    done();
                });
            });
        });
    });

});
