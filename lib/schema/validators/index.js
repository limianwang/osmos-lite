var Validator = function OsmosValidator() {
    
};

module.exports = {
    
    Validator : Validator,
    
    validators : {
        string : require('./string'),
    }
    
};