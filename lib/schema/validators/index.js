var Validator = function OsmosValidator() {
    
};

module.exports = {
    
    Validator : Validator,
    
    validators : {
        string : require('./string'),
        number : require('./number'),
        boolean : require('./boolean'),
        date : require('./date'),
        array : require('./array'),
    }
    
};