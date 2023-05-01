const jwt_secrect = "totot1232";
const jwt = require("jsonwebtoken");

// get the user from jwt 
const fetchadmin =(req, res, next) =>{

   // const token = req.headers.authorization;
const token = req.headers.authorization;
console.log(token);
 // const token = authHeader && authHeader.split(' ')[1];
    if (!token){
        res.status(401).send({error:"please validate using  token"})
    }
    
    try {
        const data = jwt.verify(token, jwt_secrect);
        
        next(); 
    } catch (error) {
        res.status(401).send({error:"please validate using valid token"})
    }
    
}
module.exports = fetchadmin;
