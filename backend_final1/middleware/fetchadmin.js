const jwt_secrect = "totot1232";
const jwt = require("jsonwebtoken");

// get the user from jwt 
const fetchadmin =(req, res, next) =>{
    const token = req.header("auth-token")
    if (!token){
        res.status(401).send({error:"please validate using valid token"})
    }
    
    try {
        const data = jwt.verify(token, jwt_secrect);
        req.user = data.user;
        next(); 
    } catch (error) {
        res.status(401).send({error:"please validate using valid token"})
    }
    
}
module.exports = fetchadmin;