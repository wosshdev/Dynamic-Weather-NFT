const DynamicWeatherCard = artifacts.require("DynamicWeatherCard");
require('dotenv').config()

module.exports = async function (deployer) {
    await deployer.deploy(DynamicWeatherCard, process.env.WAQITOKEN);
};