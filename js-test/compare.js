// create a new record,this is a 
function doPost(datain)
{
    try {
        if (datain.action) {
            switch (datain.action) {
                case 'id':
                    return getBinsById(datain.item);
                    break;
                case 'sku':
                    return getBinsBySku(datain.item);
                    break;
                default:
                    break;
            }
        } else {
            throw nlapiCreateError('FIELD_NOT_FOUND', 'The [action] field does not exist on the object definition.');
        }

    } catch (e) {
        return buildErrorResponse(e);
    }
}


function getBinsById(id)
{
    try{
    	//nlapiLogExecution('ERROR','error', 'Get item bin & qty by id start');
    	
    	var re = nlapiLoadRecord('inventoryitem', id);
    	var count = re.getLineItemCount('binnumber');
    	
        var responses = new Array();

        for (var i = 1; i <= count; i++) {
        	var binQty = new Object();
            try {
                //nlapiLogExecution('ERROR','error', datain.id[i] + ' ' + datain.recordtype);
            	binQty.onhand=re.getLineItemValue('binnumber', 'onhand', i);
            	binQty.bin=re.getLineItemValue('binnumber', 'binnumber_display', i);
            	binQty.available=re.getLineItemValue('binnumber', 'onhandavail', i);
                responses.push(binQty);
            } catch (e) {
                responses.push(buildErrorResponse(e));
            }
        }

        //nlapiLogExecution('ERROR','error', 'Get item bin & qty by id end');
        return {'result':responses};
    } catch( e) {
        nlapiLogExecution('ERROR','error', e.getDetails());
    }
}

//TODO: NOT TEST YET
function getBinsBySku(sku)
{
    try{
    	//nlapiLogExecution('ERROR','error', 'Get item bin & qty by sku start');
    	
    	var columns = new Array();
    	columns.push(new nlobjSearchColumn('binnumber'));
    	columns.push(new nlobjSearchColumn('binonhandavail'));
    	columns.push(new nlobjSearchColumn('binonhandcount'));
    	var s = nlapiSearchRecord('inventoryitem',null,new nlobjSearchFilter('externalid',null,'is',sku),columns);
    	
        var responses = new Array();
 //return {'result':responses};
        for (var i = 0; s != null && i < s.length; i++)
        {
        	var r = s[i];
        	
        	var binQty = new Object();
            try {
                //nlapiLogExecution('ERROR','error', datain.id[i] + ' ' + datain.recordtype);
            	binQty.available=r.getValue(columns[1]);
            	binQty.bin=r.getValue(columns[0]);
            	binQty.onhand=r.getValue(columns[2]);
                responses.push(binQty);
            } catch (e) {
                responses.push(buildErrorResponse(e));
            }
        }

        //nlapiLogExecution('ERROR','error', 'Get item bin & qty by sku end');
        return {'result':responses};
    } catch( e) {
        nlapiLogExecution('ERROR','error', e.getDetails());
    }
}





function buildOkResponse(content)
{
    return {'ok':content};
}

function buildErrorResponse(e)
{
	var code="";
	var detail="";
	var trace="";
	var toString="";
	try{
		code = e.getCode();		
	}catch(e){
		nlapiLogExecution("ERROR", "error", e);
	}
	try{
		detail = e.getDetails();		
	}catch(e){
		nlapiLogExecution("ERROR", "error", e);
	}
	try{
		trace = e.getStackTrace();		
	}catch(e){
		nlapiLogExecution("ERROR", "error", e);
	}
	try{
		toString = e.toString();		
	}catch(e){
		nlapiLogExecution("ERROR", "error", e);
	}
    return {"error":{"code":code, "message":detail, "stacktrace":trace,"toString":toString}}
}

function fillRecord(record, values)
{
    for (var i = 0; i < values.length; i++) {
    	var valueRecord = values[i];
    	for(var field in valueRecord){    		
	        //if (values.hasOwnProperty(field)) {
	
	            //if (field != 'recordtype' && field != 'id') {
	                var fieldExist = record.getField(field);
	                nlapiLogExecution("ERROR", "fieldExist", fieldExist);
	                if (fieldExist != null && fieldExist != false) {
	                    var value = valueRecord[field];
	
	                    if (value) {
                            nlapiLogExecution('ERROR','error', record.getId() + ' ' + field + ' = ' + value);
	                        record.setFieldValue(field, value);
	                    }
	                } else {
	                    throw nlapiCreateError('FIELD_NOT_FOUND', 'The ['+field+'] field does not exist on the object definition.');
	                }
	            //}
	
	        //}
    	}
    }
}

function fillEmptyRecord(record, values)
{
    for (var field in values) {
        if (values.hasOwnProperty(field)) {

            if (field != 'recordtype' && field != 'id') {
                var value = values[field];

                if (value) {
                    record.setFieldValue(field, value);
                }
            }
        }
    }
}
