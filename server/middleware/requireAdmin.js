const jwt = require('jsonwebtoken');
const config = require('../config/config')

const requireAdmin = async (req, res, next) => {
  const token = req.header('x-auth');
  let decoded;

  try {
    decoded = jwt.verify(token, config.secret);    
    if (decoded.role !== 'admin') {
      throw new Error();
    }
  } catch (e) {
    return res.status(401).send({error: 'You are not authorized to perform this request.'});
  }
   req.user = decoded.id    
  next();
};

module.exports = {requireAdmin};