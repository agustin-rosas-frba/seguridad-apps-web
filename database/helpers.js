const connection = require('./db.js');

const getQueriesByusername = (user) => new Promise((resolve, reject) => connection.query('SELECT query FROM queries WHERE assigned_user = ?', [user], (error, results, fields) => {
    resolve(results)
}));

module.exports = {
    getQueriesByusername
};