/**
 * 2
 */
//undefined
var s;
if(s){console.log('s is true');}
else{console.log('s is false');}

//empty array 
var A = [];
if(A){
	console.log('Test is done as if Boolean(A), since x is an object, it is true');
}

if([] == false){
	console.log('loose equality: convert x to primary type by attempting to invoke varying sequences of A.toString and A.valueOf methods on A.')
}