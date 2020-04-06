const Sequelize = require('sequelize');

const sequelize = new Sequelize('Order', 'root', '', {
  host: '127.0.0.1',
  dialect: 'mysql'
});

const User = sequelize.define('User', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    customerID: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    fullname: {
      type: Sequelize.STRING,
      allowNull: false
    },
    long: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lat: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });
module.exports = User;