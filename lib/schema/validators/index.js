module.exports = {
    
    Validator : require('./validator'),
    
    validators : {
        string : require('./string'),
        number : require('./number'),
        boolean : require('./boolean'),
        date : require('./date'),
        array : require('./array'),
        object : require('./object'),
        
        numberRange : require('./numberrange'),
        stringMatch : require('./stringmatch'),
    }
    
};